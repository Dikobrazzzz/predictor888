package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"net/http"
	"time"
)

type ctxKey string

const RequestIDKey ctxKey = "request_id"
const UserIDKey ctxKey = "user_id"

var sessionSigner *TokenSigner

func SetSessionSigner(s *TokenSigner) { sessionSigner = s }

func RequireUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := extractUserID(r)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
			return
		}
		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func extractUserID(r *http.Request) (string, bool) {
	if sessionSigner != nil {
		if auth := r.Header.Get("Authorization"); auth != "" {
			if token, ok := bearerToken(auth); ok {
				if uid, err := sessionSigner.Verify(token); err == nil {
					return uid, true
				}
			}
		}
	}
	raw := r.Header.Get("X-User-ID")
	if raw != "" && validUUID(raw) {
		return raw, true
	}
	return "", false
}

func bearerToken(h string) (string, bool) {
	const prefix = "Bearer "
	if len(h) <= len(prefix) {
		return "", false
	}
	if h[:len(prefix)] != prefix {
		return "", false
	}
	return h[len(prefix):], true
}

func UserID(r *http.Request) string {
	if v, ok := r.Context().Value(UserIDKey).(string); ok {
		return v
	}
	return ""
}

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := generateID()
		ctx := context.WithValue(r.Context(), RequestIDKey, id)
		w.Header().Set("X-Request-ID", id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func AccessLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: 200}
		next.ServeHTTP(sw, r)
		duration := time.Since(start)

		attrs := []slog.Attr{
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", sw.status),
			slog.String("duration", duration.String()),
			slog.String("ip", r.RemoteAddr),
		}
		if rid, ok := r.Context().Value(RequestIDKey).(string); ok {
			attrs = append(attrs, slog.String("rid", rid))
		}

		level := slog.LevelInfo
		if sw.status >= 500 {
			level = slog.LevelError
		} else if sw.status >= 400 {
			level = slog.LevelWarn
		}

		slog.LogAttrs(r.Context(), level, "request", attrs...)
	})
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func generateID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}
