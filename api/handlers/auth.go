package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"math/rand"
	"net/http"
	"regexp"
	"strings"
	"time"

	"predictor888/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var loginRL = newRateLimiter(5, time.Minute)

const maxBodySize = 1 << 20

var emailRe = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

type AuthHandler struct {
	DB     *pgxpool.Pool
	Lookup *LookupClient
	Signer *TokenSigner
}

func (h *AuthHandler) issueToken(userID string) string {
	if h.Signer == nil {
		return ""
	}
	return h.Signer.Issue(userID)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if !loginRL.Allow(clientIP(r)) {
		writeJSON(w, http.StatusTooManyRequests, models.LoginResponse{Error: "too many attempts, try again later"})
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(io.LimitReader(r.Body, maxBodySize)).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.LoginResponse{Error: "invalid request"})
		return
	}

	if !emailRe.MatchString(req.Email) {
		writeJSON(w, http.StatusBadRequest, models.LoginResponse{Error: "invalid email"})
		return
	}

	if h.Lookup != nil {
		found, err := h.Lookup.LookupByEmail(r.Context(), req.Email)
		if err != nil {
			slog.Error("login: lookup service error", "email", req.Email, "err", err)
			writeJSON(w, http.StatusServiceUnavailable, models.LoginResponse{Error: "service temporarily unavailable"})
			return
		}
		if !found {
			slog.Warn("login: user not found in 888starz", "email", req.Email)
			writeJSON(w, http.StatusForbidden, models.LoginResponse{Error: "access denied"})
			return
		}
	}

	var user models.User
	err := h.DB.QueryRow(r.Context(),
		`SELECT id, email, login, region, points, created_at FROM users WHERE email = $1`,
		req.Email,
	).Scan(&user.ID, &user.Email, &user.Login, &user.Region, &user.Points, &user.CreatedAt)

	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		slog.Error("login: db error", "err", err)
		writeJSON(w, http.StatusInternalServerError, models.LoginResponse{Error: "internal error"})
		return
	}

	if errors.Is(err, pgx.ErrNoRows) {
		user, err = h.autoCreateUser(r.Context(), req.Email)
		if err != nil {
			slog.Error("login: auto-create failed", "email", req.Email, "err", err)
			writeJSON(w, http.StatusInternalServerError, models.LoginResponse{Error: "internal error"})
			return
		}
		slog.Info("login: new user created", "user_id", user.ID, "email", user.Email)
		writeJSON(w, http.StatusCreated, models.LoginResponse{User: &user, Token: h.issueToken(user.ID)})
		return
	}

	slog.Info("login ok", "user_id", user.ID, "email", user.Email)
	writeJSON(w, http.StatusOK, models.LoginResponse{User: &user, Token: h.issueToken(user.ID)})
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

	if !emailRe.MatchString(req.Email) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid email"})
		return
	}
	if !validLogin(req.Login) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "login must be 2-30 alphanumeric or underscore characters"})
		return
	}
	if req.Region != "" && !validStringField(req.Region, 100) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "region too long"})
		return
	}

	if h.Lookup != nil {
		found, err := h.Lookup.LookupByEmail(r.Context(), req.Email)
		if err != nil {
			slog.Error("register: lookup service error", "email", req.Email, "err", err)
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "service temporarily unavailable"})
			return
		}
		if !found {
			slog.Warn("register: user not found in 888starz", "email", req.Email)
			writeJSON(w, http.StatusForbidden, map[string]string{"error": "access denied"})
			return
		}
	}

	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		slog.Error("register: begin tx", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	defer tx.Rollback(r.Context())

	var user models.User
	err = tx.QueryRow(r.Context(),
		`INSERT INTO users (email, login, region) VALUES ($1, $2, $3)
		 RETURNING id, email, login, region, points, created_at`,
		req.Email, req.Login, req.Region,
	).Scan(&user.ID, &user.Email, &user.Login, &user.Region, &user.Points, &user.CreatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			slog.Warn("register: conflict", "email", req.Email, "login", req.Login, "err", err)
			writeJSON(w, http.StatusConflict, map[string]string{"error": "email or login already exists"})
			return
		}
		slog.Error("register: insert user failed", "email", req.Email, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	if _, err := tx.Exec(r.Context(),
		`INSERT INTO leaderboard (user_id) VALUES ($1)`, user.ID,
	); err != nil {
		slog.Error("register: insert leaderboard failed", "user_id", user.ID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		slog.Error("register: commit failed", "user_id", user.ID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	slog.Info("register ok", "user_id", user.ID, "email", user.Email)
	writeJSON(w, http.StatusCreated, models.LoginResponse{User: &user, Token: h.issueToken(user.ID)})
}

func (h *AuthHandler) autoCreateUser(ctx context.Context, email string) (models.User, error) {
	base := sanitizeLogin(email)
	for attempt := 0; attempt < 5; attempt++ {
		login := base
		if attempt > 0 {
			login = fmt.Sprintf("%s_%04x", base, rand.Intn(0x10000))
		}
		user, err := h.insertUser(ctx, email, login)
		if err == nil {
			return user, nil
		}
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			continue
		}
		return models.User{}, err
	}
	return models.User{}, fmt.Errorf("could not allocate unique login after 5 attempts")
}

func (h *AuthHandler) insertUser(ctx context.Context, email, login string) (models.User, error) {
	tx, err := h.DB.Begin(ctx)
	if err != nil {
		return models.User{}, err
	}
	defer tx.Rollback(ctx)

	var user models.User
	err = tx.QueryRow(ctx,
		`INSERT INTO users (email, login, region) VALUES ($1, $2, '')
		 RETURNING id, email, login, region, points, created_at`,
		email, login,
	).Scan(&user.ID, &user.Email, &user.Login, &user.Region, &user.Points, &user.CreatedAt)
	if err != nil {
		return models.User{}, err
	}

	if _, err := tx.Exec(ctx, `INSERT INTO leaderboard (user_id) VALUES ($1)`, user.ID); err != nil {
		return models.User{}, err
	}

	return user, tx.Commit(ctx)
}

func sanitizeLogin(email string) string {
	prefix := strings.SplitN(email, "@", 2)[0]
	var b strings.Builder
	for _, c := range strings.ToLower(prefix) {
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '_' {
			b.WriteRune(c)
		}
	}
	s := b.String()
	if len(s) > 24 {
		s = s[:24]
	}
	if len(s) < 2 {
		s = "user"
	}
	return s
}
