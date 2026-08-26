package handlers

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"predictor888/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Промокоды: список активных и выдача кода пользователю (кнопка Claim Now).
type PromoHandler struct {
	DB *pgxpool.Pool
}

// List отдаёт активные промокоды. Сам код возвращается только после claim —
// до этого поле пустое, чтобы его нельзя было прочитать из ответа.
func (h *PromoHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserIDKey).(string)

	rows, err := h.DB.Query(r.Context(), `
		SELECT p.id, p.code, p.game, p.reward_text, pc.id IS NOT NULL
		FROM promo_codes p
		LEFT JOIN promo_claims pc
		       ON pc.promo_code_id = p.id AND pc.user_id = $1
		WHERE p.active
		  AND (p.starts_at IS NULL OR p.starts_at <= now())
		  AND (p.ends_at   IS NULL OR p.ends_at   >= now())
		ORDER BY p.sort_order`,
		userID,
	)
	if err != nil {
		slog.Error("promos: query failed", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	defer rows.Close()

	list := make([]models.Promo, 0, 8)
	fresh := 0
	for rows.Next() {
		var p models.Promo
		var code string
		if err := rows.Scan(&p.ID, &code, &p.Game, &p.RewardText, &p.Claimed); err != nil {
			slog.Error("promos: scan failed", "err", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
			return
		}
		if p.Claimed {
			p.Code = code
		} else {
			fresh++
		}
		list = append(list, p)
	}
	if err := rows.Err(); err != nil {
		slog.Error("promos: rows error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, models.PromosResponse{Promos: list, New: fresh})
}

// Claim закрепляет промокод за пользователем и возвращает сам код.
// Повторный вызов идемпотентен — отдаёт тот же код.
func (h *PromoHandler) Claim(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok || userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	var req struct {
		PromoID string `json:"promo_id"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, maxBodySize)).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}
	if !validUUID(req.PromoID) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid promo id"})
		return
	}

	var code string
	err := h.DB.QueryRow(r.Context(), `
		SELECT code FROM promo_codes
		WHERE id = $1 AND active
		  AND (starts_at IS NULL OR starts_at <= now())
		  AND (ends_at   IS NULL OR ends_at   >= now())`,
		req.PromoID,
	).Scan(&code)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "promo not found"})
		return
	}

	if _, err := h.DB.Exec(r.Context(),
		`INSERT INTO promo_claims (user_id, promo_code_id) VALUES ($1, $2)
		 ON CONFLICT (user_id, promo_code_id) DO NOTHING`,
		userID, req.PromoID,
	); err != nil {
		slog.Error("promo claim: insert failed", "user_id", userID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	slog.Info("promo claimed", "user_id", userID, "promo_id", req.PromoID)
	writeJSON(w, http.StatusOK, models.Promo{ID: req.PromoID, Code: code, Claimed: true})
}
