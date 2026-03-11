package handlers

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"predictor888/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserHandler struct {
	DB *pgxpool.Pool
}

func (h *UserHandler) Profile(w http.ResponseWriter, r *http.Request) {
	userID := UserID(r)

	var user models.User
	err := h.DB.QueryRow(r.Context(),
		`SELECT id, email, login, region, points, created_at FROM users WHERE id = $1`, userID,
	).Scan(&user.ID, &user.Email, &user.Login, &user.Region, &user.Points, &user.CreatedAt)

	if err != nil {
		slog.Warn("profile: user not found", "user_id", userID, "err", err)
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "user not found"})
		return
	}

	writeJSON(w, http.StatusOK, user)
}

func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := UserID(r)

	var req struct {
		Login  *string `json:"login"`
		Region *string `json:"region"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, maxBodySize)).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	if req.Login != nil {
		if !validLogin(*req.Login) {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "login must be 2-30 alphanumeric or underscore characters"})
			return
		}
		_, err := h.DB.Exec(r.Context(),
			`UPDATE users SET login = $1 WHERE id = $2`, *req.Login, userID)
		if err != nil {
			slog.Warn("user update: login conflict", "user_id", userID, "login", *req.Login, "err", err)
			writeJSON(w, http.StatusConflict, map[string]string{"error": "login already taken"})
			return
		}
	}
	if req.Region != nil {
		if !validStringField(*req.Region, 100) {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "region too long"})
			return
		}
		h.DB.Exec(r.Context(),
			`UPDATE users SET region = $1 WHERE id = $2`, *req.Region, userID)
	}

	var user models.User
	h.DB.QueryRow(r.Context(),
		`SELECT id, email, login, region, points, created_at FROM users WHERE id = $1`, userID,
	).Scan(&user.ID, &user.Email, &user.Login, &user.Region, &user.Points, &user.CreatedAt)

	slog.Info("user updated", "user_id", userID)
	writeJSON(w, http.StatusOK, user)
}
