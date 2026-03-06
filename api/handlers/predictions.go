package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"predictor888/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PredictionHandler struct {
	DB *pgxpool.Pool
}

func (h *PredictionHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "missing user id"})
		return
	}

	var req models.PredictionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	if req.EventID == "" || req.Outcome == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "event_id and outcome required"})
		return
	}

	if req.Outcome != "home" && req.Outcome != "draw" && req.Outcome != "away" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "outcome must be home, draw, or away"})
		return
	}

	var pred models.Prediction
	err := h.DB.QueryRow(context.Background(),
		`INSERT INTO predictions (user_id, event_id, sport, league, home_team, away_team, outcome)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, user_id, event_id, sport, league, home_team, away_team, outcome, points, status, created_at`,
		userID, req.EventID, req.Sport, req.League, req.HomeTeam, req.AwayTeam, req.Outcome,
	).Scan(&pred.ID, &pred.UserID, &pred.EventID, &pred.Sport, &pred.League,
		&pred.HomeTeam, &pred.AwayTeam, &pred.Outcome, &pred.Points, &pred.Status, &pred.CreatedAt)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create prediction"})
		return
	}

	writeJSON(w, http.StatusCreated, pred)
}

func (h *PredictionHandler) ListByUser(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "missing user id"})
		return
	}

	rows, err := h.DB.Query(context.Background(),
		`SELECT id, user_id, event_id, sport, league, home_team, away_team, outcome, points, status, created_at
		 FROM predictions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "query failed"})
		return
	}
	defer rows.Close()

	preds := []models.Prediction{}
	for rows.Next() {
		var p models.Prediction
		if err := rows.Scan(&p.ID, &p.UserID, &p.EventID, &p.Sport, &p.League,
			&p.HomeTeam, &p.AwayTeam, &p.Outcome, &p.Points, &p.Status, &p.CreatedAt); err != nil {
			continue
		}
		preds = append(preds, p)
	}

	writeJSON(w, http.StatusOK, preds)
}
