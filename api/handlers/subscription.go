package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Строка «Subscripition» в карточке Profile Information: подписан ли пользователь
// на канал бота. Состояния из макета — Active (зелёная галочка) и Inactive
// (оранжевый текст плюс жёлтая кнопка Subscribe).
//
// Источник истины — Telegram Bot API getChatMember. Своей таблицы нет намеренно:
// отписаться можно в любой момент, и закешированный ответ быстро начнёт врать.
type SubscriptionHandler struct {
	DB *pgxpool.Pool

	BotToken   string // TELEGRAM_BOT_TOKEN
	ChannelID  string // TELEGRAM_CHANNEL_ID, например @predictor888 или -1001234567890
	ChannelURL string // TELEGRAM_CHANNEL_URL — куда ведёт кнопка Subscribe

	client *http.Client
}

func NewSubscriptionHandler(db *pgxpool.Pool) *SubscriptionHandler {
	return &SubscriptionHandler{
		DB:         db,
		BotToken:   os.Getenv("TELEGRAM_BOT_TOKEN"),
		ChannelID:  os.Getenv("TELEGRAM_CHANNEL_ID"),
		ChannelURL: os.Getenv("TELEGRAM_CHANNEL_URL"),
		client:     &http.Client{Timeout: 5 * time.Second},
	}
}

func (h *SubscriptionHandler) configured() bool {
	return h.BotToken != "" && h.ChannelID != ""
}

type subscriptionResponse struct {
	Subscribed bool   `json:"subscribed"`
	ChannelURL string `json:"channel_url,omitempty"`
	// Проверить не удалось (нет токена, Telegram недоступен, привязки нет).
	// Фронт в этом случае показывает Inactive, но не считает это фактом отписки.
	Unknown bool `json:"unknown,omitempty"`
}

func (h *SubscriptionHandler) Status(w http.ResponseWriter, r *http.Request) {
	userID := UserID(r)

	resp := subscriptionResponse{ChannelURL: h.ChannelURL}

	if !h.configured() {
		slog.Warn("subscription: TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not set")
		resp.Unknown = true
		writeJSON(w, http.StatusOK, resp)
		return
	}

	var tgID string
	err := h.DB.QueryRow(r.Context(),
		`SELECT telegram_user_id FROM telegram_links WHERE user_id = $1`, userID,
	).Scan(&tgID)
	if err == pgx.ErrNoRows {
		// Telegram не привязан — подписку проверять не у кого.
		resp.Unknown = true
		writeJSON(w, http.StatusOK, resp)
		return
	}
	if err != nil {
		slog.Error("subscription: link lookup failed", "user_id", userID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	member, err := h.isChatMember(r.Context(), tgID)
	if err != nil {
		slog.Warn("subscription: getChatMember failed", "user_id", userID, "err", err)
		resp.Unknown = true
		writeJSON(w, http.StatusOK, resp)
		return
	}

	resp.Subscribed = member
	writeJSON(w, http.StatusOK, resp)
}

// isChatMember спрашивает Telegram, состоит ли пользователь в канале.
// Статусы left и kicked означают «не подписан», остальные — подписан.
func (h *SubscriptionHandler) isChatMember(ctx context.Context, telegramUserID string) (bool, error) {
	endpoint := "https://api.telegram.org/bot" + h.BotToken + "/getChatMember?" + url.Values{
		"chat_id": {h.ChannelID},
		"user_id": {telegramUserID},
	}.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return false, err
	}
	res, err := h.client.Do(req)
	if err != nil {
		return false, err
	}
	defer res.Body.Close()

	var body struct {
		OK     bool `json:"ok"`
		Result struct {
			Status string `json:"status"`
		} `json:"result"`
	}
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		return false, err
	}
	if !body.OK {
		// Telegram отвечает 400, если пользователь никогда не открывал канал.
		return false, nil
	}

	switch body.Result.Status {
	case "left", "kicked":
		return false, nil
	default:
		return true, nil
	}
}

// Delete — кнопка «Delete» в строке Delete Bot. Стирает данные пользователя:
// прогнозы, квесты, промо-выдачи, визиты, привязку Telegram и саму запись.
// Сам бот удаляется на стороне Telegram самим пользователем, этого API не касается.
func (h *SubscriptionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := UserID(r)

	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		slog.Error("delete account: begin failed", "user_id", userID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	defer tx.Rollback(context.Background())

	// Часть таблиц уже имеет ON DELETE CASCADE, часть — нет; чистим явно,
	// чтобы удаление не зависело от того, какая миграция создала таблицу.
	for _, q := range []string{
		`DELETE FROM telegram_links WHERE user_id = $1`,
		`DELETE FROM user_visits    WHERE user_id = $1`,
		`DELETE FROM user_quests    WHERE user_id = $1`,
		`DELETE FROM weekly_rewards WHERE user_id = $1`,
		`DELETE FROM promo_claims   WHERE user_id = $1`,
		`DELETE FROM token_transactions WHERE user_id = $1`,
		`DELETE FROM predictions    WHERE user_id = $1`,
		`DELETE FROM leaderboard    WHERE user_id = $1`,
		`DELETE FROM users          WHERE id = $1`,
	} {
		if _, err := tx.Exec(r.Context(), q, userID); err != nil {
			slog.Error("delete account: statement failed", "user_id", userID, "query", q, "err", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
			return
		}
	}

	if err := tx.Commit(r.Context()); err != nil {
		slog.Error("delete account: commit failed", "user_id", userID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	slog.Info("account deleted", "user_id", userID)
	w.WriteHeader(http.StatusNoContent)
}
