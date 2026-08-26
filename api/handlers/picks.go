package handlers

import (
	"log/slog"
	"net/http"

	"predictor888/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Top Picks — прогнозы амбассадора. Один из них помечен featured и рисуется
// как «Pick of the day» на экране Events.
type PickHandler struct {
	DB *pgxpool.Pool
}

func (h *PickHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(), `
		SELECT p.id, p.league, p.home_team, p.away_team, p.comment,
		       p.outcome, p.odds, p.starts_at, p.featured,
		       a.name, a.role, a.avatar_url, a.accuracy, a.instagram
		FROM top_picks p
		JOIN analysts a ON a.id = p.analyst_id
		WHERE p.active AND a.active
		ORDER BY p.featured DESC, p.starts_at NULLS LAST, p.created_at`)
	if err != nil {
		slog.Error("picks: query failed", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	defer rows.Close()

	list := make([]models.TopPick, 0, 8)
	for rows.Next() {
		var p models.TopPick
		if err := rows.Scan(&p.ID, &p.League, &p.HomeTeam, &p.AwayTeam, &p.Comment,
			&p.Outcome, &p.Odds, &p.StartsAt, &p.Featured,
			&p.Analyst.Name, &p.Analyst.Role, &p.Analyst.Avatar,
			&p.Analyst.Accuracy, &p.Analyst.Instagram); err != nil {
			slog.Error("picks: scan failed", "err", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
			return
		}
		list = append(list, p)
	}
	if err := rows.Err(); err != nil {
		slog.Error("picks: rows error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, list)
}
