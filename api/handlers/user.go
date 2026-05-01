package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"predictor888/models"

	"github.com/jackc/pgx/v5/pgconn"
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

	if req.Login == nil && req.Region == nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "nothing to update"})
		return
	}

	if req.Login != nil && !validLogin(*req.Login) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "login must be 2-30 alphanumeric or underscore characters"})
		return
	}
	if req.Region != nil && !validOptionalField(*req.Region, 100) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "region too long"})
		return
	}

	// Single round-trip: COALESCE leaves field unchanged when nil is passed.
	var user models.User
	err := h.DB.QueryRow(r.Context(),
		`UPDATE users
		 SET    login  = COALESCE($1, login),
		        region = COALESCE($2, region)
		 WHERE  id = $3
		 RETURNING id, email, login, region, points, created_at`,
		req.Login, req.Region, userID,
	).Scan(&user.ID, &user.Email, &user.Login, &user.Region, &user.Points, &user.CreatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			slog.Warn("user update: login conflict", "user_id", userID, "err", err)
			writeJSON(w, http.StatusConflict, map[string]string{"error": "login already taken"})
			return
		}
		slog.Error("user update failed", "user_id", userID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "update failed"})
		return
	}

	slog.Info("user updated", "user_id", userID)
	writeJSON(w, http.StatusOK, user)
}
