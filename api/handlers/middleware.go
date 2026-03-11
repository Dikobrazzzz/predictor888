package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"net/http"
	"strconv"
	"time"
)

type ctxKey string

const RequestIDKey ctxKey = "request_id"
const UserIDKey ctxKey = "user_id"

func RequireUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw := r.Header.Get("X-User-ID")
		if raw == "" {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "missing user id"})
			return
		}
		if _, err := strconv.Atoi(raw); err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid user id"})
			return
		}
		ctx := context.WithValue(r.Context(), UserIDKey, raw)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
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
