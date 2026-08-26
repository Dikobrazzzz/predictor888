package handlers

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Токены и отметки визитов: источник данных для квестов «Spend 10 tokens»
// и «Login 5 days in a row», плюс счётчик монет в шапке.
type TokenHandler struct {
	DB *pgxpool.Pool
}

// addTokens меняет баланс и пишет строку в журнал одной транзакцией.
// Отрицательный amount — списание; уходить в минус не даём.
func addTokens(ctx context.Context, db *pgxpool.Pool, userID string, amount int, reason, ref string) (int, error) {
	tx, err := db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	var balance int
	if err := tx.QueryRow(ctx,
		`SELECT tokens FROM users WHERE id = $1 FOR UPDATE`, userID,
	).Scan(&balance); err != nil {
		return 0, err
	}

	if balance+amount < 0 {
		return balance, errInsufficientTokens
	}

	if err := tx.QueryRow(ctx,
		`UPDATE users SET tokens = tokens + $1 WHERE id = $2 RETURNING tokens`,
		amount, userID,
	).Scan(&balance); err != nil {
		return 0, err
	}

	if _, err := tx.Exec(ctx,
		`INSERT INTO token_transactions (user_id, amount, reason, ref) VALUES ($1, $2, $3, $4)`,
		userID, amount, reason, ref,
	); err != nil {
		return 0, err
	}

	return balance, tx.Commit(ctx)
}

type tokenError string

func (e tokenError) Error() string { return string(e) }

const errInsufficientTokens = tokenError("insufficient tokens")

// Spend списывает токены. Реальных трат в продукте пока нет — ручка нужна,
// чтобы квест «Spend 10 tokens» было чем двигать.
func (h *TokenHandler) Spend(w http.ResponseWriter, r *http.Request) {
	userID := UserID(r)

	var req struct {
		Amount int    `json:"amount"`
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, maxBodySize)).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}
	if req.Amount <= 0 || req.Amount > 100000 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "amount must be positive"})
		return
	}
	if !validOptionalField(req.Reason, 64) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "reason too long"})
		return
	}

	balance, err := addTokens(r.Context(), h.DB, userID, -req.Amount, req.Reason, "")
	if err == errInsufficientTokens {
		writeJSON(w, http.StatusConflict, map[string]interface{}{"error": "insufficient tokens", "tokens": balance})
		return
	}
	if err != nil {
		slog.Error("tokens: spend failed", "user_id", userID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	slog.Info("tokens spent", "user_id", userID, "amount", req.Amount, "balance", balance)
	writeJSON(w, http.StatusOK, map[string]int{"tokens": balance})
}

// Visit отмечает заход пользователя за сегодня и возвращает длину серии.
// Идемпотентна: повторный вызов в тот же день ничего не меняет.
func (h *TokenHandler) Visit(w http.ResponseWriter, r *http.Request) {
	userID := UserID(r)

	if _, err := h.DB.Exec(r.Context(),
		`INSERT INTO user_visits (user_id, visit_date) VALUES ($1, (now() AT TIME ZONE 'utc')::date)
		 ON CONFLICT DO NOTHING`, userID,
	); err != nil {
		slog.Error("visit: insert failed", "user_id", userID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	streak, err := loginStreak(r.Context(), h.DB, userID)
	if err != nil {
		slog.Error("visit: streak failed", "user_id", userID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]int{"streak": streak})
}

// loginStreak считает, сколько дней подряд заканчивая сегодняшним (или вчерашним,
// если сегодня захода ещё не было) пользователь открывал приложение.
func loginStreak(ctx context.Context, db *pgxpool.Pool, userID string) (int, error) {
	rows, err := db.Query(ctx,
		`SELECT visit_date FROM user_visits WHERE user_id = $1 ORDER BY visit_date DESC LIMIT 400`,
		userID,
	)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	dates := make([]time.Time, 0, 64)
	for rows.Next() {
		var d time.Time
		if err := rows.Scan(&d); err != nil {
			return 0, err
		}
		dates = append(dates, d.UTC().Truncate(24*time.Hour))
	}
	if err := rows.Err(); err != nil {
		return 0, err
	}

	return streakFromDates(dates, time.Now()), nil
}

// streakFromDates ждёт даты по убыванию. Вынесено отдельно ради тестов.
func streakFromDates(dates []time.Time, now time.Time) int {
	if len(dates) == 0 {
		return 0
	}

	today := now.UTC().Truncate(24 * time.Hour)
	expected := today
	if !dates[0].Equal(today) {
		// Сегодня ещё не заходил — серия может тянуться со вчера.
		expected = today.AddDate(0, 0, -1)
		if !dates[0].Equal(expected) {
			return 0
		}
	}

	streak := 0
	for _, d := range dates {
		if d.Equal(expected) {
			streak++
			expected = expected.AddDate(0, 0, -1)
			continue
		}
		if d.After(expected) {
			continue // дубль, пропускаем
		}
		break
	}
	return streak
}

// tokensSpentSince — сколько токенов потрачено с указанного момента.
func tokensSpentSince(ctx context.Context, db *pgxpool.Pool, userID string, from time.Time) (int, error) {
	var spent int
	err := db.QueryRow(ctx,
		`SELECT COALESCE(-SUM(amount), 0) FROM token_transactions
		 WHERE user_id = $1 AND amount < 0 AND created_at >= $2`,
		userID, from,
	).Scan(&spent)
	if err != nil && err != pgx.ErrNoRows {
		return 0, err
	}
	return spent, nil
}
