package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"regexp"

	"predictor888/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

const maxBodySize = 1 << 20 // 1 MB

var emailRe = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

type AuthHandler struct {
	DB *pgxpool.Pool
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(io.LimitReader(r.Body, maxBodySize)).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.LoginResponse{Error: "invalid request"})
		return
	}

	if !emailRe.MatchString(req.Email) {
		writeJSON(w, http.StatusBadRequest, models.LoginResponse{Error: "invalid email"})
		return
	}

	var user models.User
	err := h.DB.QueryRow(r.Context(),
		`SELECT id, email, login, region, points, created_at FROM users WHERE email = $1`,
		req.Email,
	).Scan(&user.ID, &user.Email, &user.Login, &user.Region, &user.Points, &user.CreatedAt)

	if err != nil {
		writeJSON(w, http.StatusNotFound, models.LoginResponse{Error: "email not found"})
		return
	}

	writeJSON(w, http.StatusOK, models.LoginResponse{User: &user})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email  string `json:"email"`
		Login  string `json:"login"`
		Region string `json:"region"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, maxBodySize)).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	if !emailRe.MatchString(req.Email) || req.Login == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid email or login"})
		return
	}

	var user models.User
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO users (email, login, region) VALUES ($1, $2, $3)
		 RETURNING id, email, login, region, points, created_at`,
		req.Email, req.Login, req.Region,
	).Scan(&user.ID, &user.Email, &user.Login, &user.Region, &user.Points, &user.CreatedAt)

	if err != nil {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "email or login already exists"})
		return
	}

	h.DB.Exec(r.Context(),
		`INSERT INTO leaderboard (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, user.ID)

	writeJSON(w, http.StatusCreated, models.LoginResponse{User: &user})
}
