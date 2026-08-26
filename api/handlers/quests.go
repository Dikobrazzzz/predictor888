package handlers

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"predictor888/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Квесты недельные: прогресс и награда живут внутри одной календарной недели.
type QuestHandler struct {
	DB *pgxpool.Pool
}

// weekStart возвращает понедельник 00:00 UTC для переданного момента.
func weekStart(t time.Time) time.Time {
	utc := t.UTC()
	offset := (int(utc.Weekday()) + 6) % 7 // Monday = 0
	d := utc.AddDate(0, 0, -offset)
	return time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, time.UTC)
}

// derivedProgress считает все метрики из фактических данных, поэтому
// user_quests.progress нужен только как отметка о выданной награде.
func (h *QuestHandler) derivedProgress(ctx context.Context, userID string, from time.Time) (map[string]int, error) {
	out := map[string]int{}

	var made, won, xp int
	err := h.DB.QueryRow(ctx, `
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE status = 'win'),
			COALESCE(SUM(points) FILTER (WHERE status = 'win'), 0)
		FROM predictions
		WHERE user_id = $1 AND created_at >= $2`,
		userID, from,
	).Scan(&made, &won, &xp)
	if err != nil {
		return nil, err
	}

	out["predictions_made"] = made
	out["predictions_won"] = won
	out["xp_earned"] = xp

	spent, err := tokensSpentSince(ctx, h.DB, userID, from)
	if err != nil {
		return nil, err
	}
	out["tokens_spent"] = spent

	streak, err := loginStreak(ctx, h.DB, userID)
	if err != nil {
		return nil, err
	}
	out["login_streak"] = streak

	return out, nil
}

// grantReward начисляет награду за квест один раз за неделю.
// Защита от повторной выдачи — уникальный индекс по (user, quest, period).
func (h *QuestHandler) grantReward(ctx context.Context, userID, questID, code, kind string, value int, period time.Time) {
	tag, err := h.DB.Exec(ctx,
		`INSERT INTO user_quests (user_id, quest_id, period_start, progress, completed_at, rewarded_at)
		 VALUES ($1, $2, $3, 0, now(), now())
		 ON CONFLICT (user_id, quest_id, period_start) DO UPDATE
		    SET completed_at = COALESCE(user_quests.completed_at, now()),
		        rewarded_at  = COALESCE(user_quests.rewarded_at, now())
		  WHERE user_quests.rewarded_at IS NULL`,
		userID, questID, period,
	)
	if err != nil {
		slog.Error("quest reward: mark failed", "quest", code, "err", err)
		return
	}
	if tag.RowsAffected() == 0 {
		return // награда уже выдавалась
	}

	switch kind {
	case "tokens":
		if _, err := addTokens(ctx, h.DB, userID, value, "quest", code); err != nil {
			slog.Error("quest reward: tokens failed", "quest", code, "err", err)
			return
		}
	case "xp":
		tx, err := h.DB.Begin(ctx)
		if err != nil {
			slog.Error("quest reward: begin failed", "quest", code, "err", err)
			return
		}
		if err := addXP(ctx, tx, userID, value); err != nil {
			tx.Rollback(ctx)
			slog.Error("quest reward: xp failed", "quest", code, "err", err)
			return
		}
		if err := tx.Commit(ctx); err != nil {
			slog.Error("quest reward: commit failed", "quest", code, "err", err)
			return
		}
	}
	slog.Info("quest reward granted", "user_id", userID, "quest", code, "kind", kind, "value", value)
}

// List отдаёт квесты текущей недели с прогрессом и состоянием недельной награды.
func (h *QuestHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserIDKey).(string)
	period := weekStart(time.Now())

	rows, err := h.DB.Query(r.Context(), `
		SELECT q.id, q.code, q.metric, q.target, q.reward_kind, q.reward_value,
		       COALESCE(uq.progress, 0), uq.completed_at IS NOT NULL
		FROM quests q
		LEFT JOIN user_quests uq
		       ON uq.quest_id = q.id AND uq.user_id = $1 AND uq.period_start = $2
		WHERE q.active
		ORDER BY q.sort_order`,
		userID, period,
	)
	if err != nil {
		slog.Error("quests: query failed", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	defer rows.Close()

	derived, err := h.derivedProgress(r.Context(), userID, period)
	if err != nil {
		slog.Error("quests: derived progress failed", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	list := make([]models.Quest, 0, 8)
	done := 0
	for rows.Next() {
		var q models.Quest
		var stored int
		var completed bool
		if err := rows.Scan(&q.ID, &q.Code, &q.Metric, &q.Target,
			&q.RewardKind, &q.RewardValue, &stored, &completed); err != nil {
			slog.Error("quests: scan failed", "err", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
			return
		}

		q.Progress = stored
		if v, ok := derived[q.Metric]; ok {
			q.Progress = v
		}
		if q.Progress > q.Target {
			q.Progress = q.Target
		}
		q.Completed = q.Progress >= q.Target
		if q.Completed {
			done++
			if !completed && userID != "" {
				h.grantReward(r.Context(), userID, q.ID, q.Code, q.RewardKind, q.RewardValue, period)
			}
		}
		list = append(list, q)
	}
	if err := rows.Err(); err != nil {
		slog.Error("quests: rows error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	claimed := false
	if userID != "" {
		var at time.Time
		err := h.DB.QueryRow(r.Context(),
			`SELECT claimed_at FROM weekly_rewards WHERE user_id = $1 AND period_start = $2`,
			userID, period,
		).Scan(&at)
		if err == nil {
			claimed = true
		} else if !errors.Is(err, pgx.ErrNoRows) {
			slog.Error("quests: weekly reward lookup failed", "err", err)
		}
	}

	writeJSON(w, http.StatusOK, models.QuestsResponse{
		Quests:        list,
		Done:          done,
		Total:         len(list),
		PeriodStart:   period,
		PeriodEnd:     period.AddDate(0, 0, 7),
		RewardClaimed: claimed,
	})
}

// Claim выдаёт недельную награду — доступна, когда закрыты все квесты недели.
func (h *QuestHandler) Claim(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok || userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	period := weekStart(time.Now())

	derived, err := h.derivedProgress(r.Context(), userID, period)
	if err != nil {
		slog.Error("quest claim: derived progress failed", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	rows, err := h.DB.Query(r.Context(), `
		SELECT q.metric, q.target, COALESCE(uq.progress, 0)
		FROM quests q
		LEFT JOIN user_quests uq
		       ON uq.quest_id = q.id AND uq.user_id = $1 AND uq.period_start = $2
		WHERE q.active`,
		userID, period,
	)
	if err != nil {
		slog.Error("quest claim: query failed", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	defer rows.Close()

	total, done := 0, 0
	for rows.Next() {
		var metric string
		var target, stored int
		if err := rows.Scan(&metric, &target, &stored); err != nil {
			slog.Error("quest claim: scan failed", "err", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
			return
		}
		progress := stored
		if v, ok := derived[metric]; ok {
			progress = v
		}
		total++
		if progress >= target {
			done++
		}
	}
	if err := rows.Err(); err != nil {
		slog.Error("quest claim: rows error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	if total == 0 || done < total {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "quests not completed"})
		return
	}

	tag, err := h.DB.Exec(r.Context(),
		`INSERT INTO weekly_rewards (user_id, period_start) VALUES ($1, $2)
		 ON CONFLICT (user_id, period_start) DO NOTHING`,
		userID, period,
	)
	if err != nil {
		slog.Error("quest claim: insert failed", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	if tag.RowsAffected() == 0 {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "already claimed"})
		return
	}

	slog.Info("weekly reward claimed", "user_id", userID, "period", period)
	writeJSON(w, http.StatusOK, map[string]bool{"claimed": true})
}
