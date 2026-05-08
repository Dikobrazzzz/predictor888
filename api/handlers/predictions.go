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

type PredictionHandler struct {
	DB *pgxpool.Pool
}

func (h *PredictionHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := UserID(r)

	var req models.PredictionRequest
	if err := json.NewDecoder(io.LimitReader(r.Body, maxBodySize)).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	if req.EventID == "" || req.Outcome == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "event_id and outcome required"})
		return
	}
	if !validStringField(req.EventID, 64) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "event_id too long"})
		return
	}
	if req.Sport != "" && !validStringField(req.Sport, 200) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "sport too long"})
		return
	}
	if req.League != "" && !validStringField(req.League, 200) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "league too long"})
		return
	}
	if req.HomeTeam != "" && !validStringField(req.HomeTeam, 200) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "home_team too long"})
		return
	}
	if req.AwayTeam != "" && !validStringField(req.AwayTeam, 200) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "away_team too long"})
		return
	}
	if req.Outcome != "home" && req.Outcome != "draw" && req.Outcome != "away" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "outcome must be home, draw, or away"})
		return
	}

	var pred models.Prediction
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO predictions (user_id, event_id, sport, league, home_team, away_team, outcome)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, user_id, event_id, sport, league, home_team, away_team, outcome, points, status, created_at`,
		userID, req.EventID, req.Sport, req.League, req.HomeTeam, req.AwayTeam, req.Outcome,
	).Scan(&pred.ID, &pred.UserID, &pred.EventID, &pred.Sport, &pred.League,
		&pred.HomeTeam, &pred.AwayTeam, &pred.Outcome, &pred.Points, &pred.Status, &pred.CreatedAt)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			writeJSON(w, http.StatusConflict, map[string]string{"error": "you already made a prediction for this match"})
			return
		}
		slog.Error("prediction create failed", "user_id", userID, "event_id", req.EventID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create prediction"})
		return
	}

	slog.Info("prediction created", "id", pred.ID, "user_id", userID, "event_id", req.EventID, "outcome", req.Outcome)
	writeJSON(w, http.StatusCreated, pred)
}

func (h *PredictionHandler) ListByUser(w http.ResponseWriter, r *http.Request) {
	userID := UserID(r)

	rows, err := h.DB.Query(r.Context(),
		`SELECT id, user_id, event_id, sport, league, home_team, away_team, outcome, points, status, created_at
		 FROM predictions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, userID)
	if err != nil {
		slog.Error("predictions list query failed", "user_id", userID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "query failed"})
		return
	}
	defer rows.Close()

	preds := []models.Prediction{}
	for rows.Next() {
		var p models.Prediction
		if err := rows.Scan(&p.ID, &p.UserID, &p.EventID, &p.Sport, &p.League,
			&p.HomeTeam, &p.AwayTeam, &p.Outcome, &p.Points, &p.Status, &p.CreatedAt); err != nil {
			slog.Warn("predictions scan error", "user_id", userID, "err", err)
			continue
		}
		preds = append(preds, p)
	}
	if err := rows.Err(); err != nil {
		slog.Error("predictions iteration failed", "user_id", userID, "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "read failed"})
		return
	}

	writeJSON(w, http.StatusOK, preds)
}
