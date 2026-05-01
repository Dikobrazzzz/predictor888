package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
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
	body, _ := json.Marshal(map[string]any{"email": email})

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
	io.Copy(io.Discard, io.LimitReader(resp.Body, 64*1024))

	if resp.StatusCode == http.StatusNotFound {
		return false, nil
	}
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("lookup service returned %d", resp.StatusCode)
	}
	return true, nil
}
