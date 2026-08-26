package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"
)

type LookupClient struct {
	baseURL string
	apiKey  string
	client  *http.Client
}

func NewLookupClient(baseURL, apiKey string) *LookupClient {
	if baseURL == "" || apiKey == "" {
		return nil
	}
	return &LookupClient{
		baseURL: baseURL,
		apiKey:  apiKey,
		client:  &http.Client{Timeout: 5 * time.Second},
	}
}

func (c *LookupClient) LookupByEmail(ctx context.Context, email string) (found bool, err error) {
	return c.lookup(ctx, map[string]any{"email": email}, "email", email)
}

// LookupByPlayerID спрашивает тот же POST /lookup, но по идентификатору игрока.
// Имя поля в теле запроса согласовано как player_id — если сервис ждёт другое,
// менять здесь.
func (c *LookupClient) LookupByPlayerID(ctx context.Context, playerID string) (found bool, err error) {
	return c.lookup(ctx, map[string]any{"player_id": playerID}, "player_id", playerID)
}

func (c *LookupClient) lookup(ctx context.Context, payload map[string]any, logKey, logVal string) (found bool, err error) {
	body, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/lookup", bytes.NewReader(body))
	if err != nil {
		return false, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", c.apiKey)

	resp, err := c.client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 64*1024))

	slog.Info("lookup response", logKey, logVal, "status", resp.StatusCode, "body", string(bodyBytes))

	if resp.StatusCode == http.StatusNotFound {
		return false, nil
	}
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("lookup service returned %d", resp.StatusCode)
	}
	return true, nil
}
