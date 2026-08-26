package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"regexp"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Привязка Player ID к Telegram-аккаунту (экран Telegram ID_375).
// Исходы соответствуют состояниям макета:
//
//	201 — привязали, экран Telegram ID_Success_375
//	404 — Player ID not found
//	409 — This Player ID is already linked to another Telegram account
//	5xx — Something went wrong
type TelegramHandler struct {
	DB     *pgxpool.Pool
	Lookup *LookupClient
}

var playerIDRe = regexp.MustCompile(`^[0-9]{4,20}$`)

var telegramLinkRL = newRateLimiter(10, time.Minute)

type linkRequest struct {
	PlayerID       string `json:"player_id"`
	TelegramUserID string `json:"telegram_user_id"`
	// Подписанная строка Telegram WebApp. Пока принимается и не проверяется —
	// валидация по HMAC ждёт TELEGRAM_BOT_TOKEN (TODO.md, п. 1.2).
	InitData string `json:"init_data"`
}

type linkResponse struct {
	PlayerID string `json:"player_id,omitempty"`
	Error    string `json:"error,omitempty"`
}

func (h *TelegramHandler) Link(w http.ResponseWriter, r *http.Request) {
	if !telegramLinkRL.Allow(clientIP(r)) {
		writeJSON(w, http.StatusTooManyRequests, linkResponse{Error: "too many attempts, try again later"})
		return
	}

	var req linkRequest
	if err := json.NewDecoder(io.LimitReader(r.Body, maxBodySize)).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, linkResponse{Error: "invalid request"})
		return
	}

	if !playerIDRe.MatchString(req.PlayerID) {
		writeJSON(w, http.StatusNotFound, linkResponse{Error: "player id not found"})
		return
	}
	if !validStringField(req.TelegramUserID, 64) {
		writeJSON(w, http.StatusBadRequest, linkResponse{Error: "telegram_user_id is required"})
		return
	}

	// Проверяем существование игрока во внешнем сервисе тем же POST /lookup.
	if h.Lookup != nil {
		found, err := h.Lookup.LookupByPlayerID(r.Context(), req.PlayerID)
		if err != nil {
			slog.Error("link: lookup service error", "player_id", req.PlayerID, "err", err)
			writeJSON(w, http.StatusServiceUnavailable, linkResponse{Error: "service temporarily unavailable"})
			return
		}
		if !found {
			slog.Warn("link: player id not found", "player_id", req.PlayerID)
			writeJSON(w, http.StatusNotFound, linkResponse{Error: "player id not found"})
			return
		}
	}

	// Повторная привязка тем же Telegram — идемпотентна.
	var existingTG string
	err := h.DB.QueryRow(r.Context(),
		`SELECT telegram_user_id FROM telegram_links WHERE player_id = $1`, req.PlayerID,
	).Scan(&existingTG)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		slog.Error("link: db error", "err", err)
		writeJSON(w, http.StatusInternalServerError, linkResponse{Error: "internal error"})
		return
	}
	if err == nil {
		if existingTG == req.TelegramUserID {
			writeJSON(w, http.StatusOK, linkResponse{PlayerID: req.PlayerID})
			return
		}
		writeJSON(w, http.StatusConflict, linkResponse{Error: "player id already linked"})
		return
	}

	var userID *string
	if uid, ok := r.Context().Value(UserIDKey).(string); ok && uid != "" {
		userID = &uid
	}

	if _, err := h.DB.Exec(r.Context(),
		`INSERT INTO telegram_links (player_id, telegram_user_id, user_id) VALUES ($1, $2, $3)`,
		req.PlayerID, req.TelegramUserID, userID,
	); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			// Гонка двух запросов либо этот Telegram уже держит другой Player ID.
			writeJSON(w, http.StatusConflict, linkResponse{Error: "player id already linked"})
			return
		}
		slog.Error("link: insert failed", "player_id", req.PlayerID, "err", err)
		writeJSON(w, http.StatusInternalServerError, linkResponse{Error: "internal error"})
		return
	}

	slog.Info("telegram linked", "player_id", req.PlayerID, "telegram_user_id", req.TelegramUserID)
	writeJSON(w, http.StatusCreated, linkResponse{PlayerID: req.PlayerID})
}

// Status отвечает на вопрос «показывать ли онбординг» для конкретного Telegram.
func (h *TelegramHandler) Status(w http.ResponseWriter, r *http.Request) {
	tgID := r.URL.Query().Get("telegram_user_id")
	if !validStringField(tgID, 64) {
		writeJSON(w, http.StatusBadRequest, linkResponse{Error: "telegram_user_id is required"})
		return
	}

	var playerID string
	err := h.DB.QueryRow(r.Context(),
		`SELECT player_id FROM telegram_links WHERE telegram_user_id = $1`, tgID,
	).Scan(&playerID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, linkResponse{Error: "not linked"})
		return
	}
	if err != nil {
		slog.Error("link status: db error", "err", err)
		writeJSON(w, http.StatusInternalServerError, linkResponse{Error: "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, linkResponse{PlayerID: playerID})
}
