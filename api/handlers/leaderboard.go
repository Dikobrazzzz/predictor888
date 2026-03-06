package handlers

import (
	"context"
	"net/http"

	"predictor888/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type LeaderboardHandler struct {
	DB *pgxpool.Pool
}

func (h *LeaderboardHandler) Top(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(context.Background(),
		`SELECT l.user_id, u.login, l.total_points, l.wins, l.losses, l.rank, l.period, l.updated_at
		 FROM leaderboard l JOIN users u ON u.id = l.user_id
		 WHERE l.period = 'all'
		 ORDER BY l.total_points DESC LIMIT 50`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "query failed"})
		return
	}
	defer rows.Close()

	entries := []models.LeaderboardEntry{}
	for rows.Next() {
		var e models.LeaderboardEntry
		if err := rows.Scan(&e.UserID, &e.Login, &e.TotalPoints, &e.Wins, &e.Losses,
			&e.Rank, &e.Period, &e.UpdatedAt); err != nil {
			continue
		}
		entries = append(entries, e)
	}

	writeJSON(w, http.StatusOK, entries)
}

func (h *LeaderboardHandler) UserStats(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "missing user id"})
		return
	}

	var e models.LeaderboardEntry
	err := h.DB.QueryRow(context.Background(),
		`SELECT l.user_id, u.login, l.total_points, l.wins, l.losses, l.rank, l.period, l.updated_at
		 FROM leaderboard l JOIN users u ON u.id = l.user_id
		 WHERE l.user_id = $1 AND l.period = 'all'`, userID,
	).Scan(&e.UserID, &e.Login, &e.TotalPoints, &e.Wins, &e.Losses, &e.Rank, &e.Period, &e.UpdatedAt)

	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "user not found in leaderboard"})
		return
	}

	writeJSON(w, http.StatusOK, e)
}
