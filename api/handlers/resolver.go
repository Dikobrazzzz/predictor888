package handlers

import (
	"context"
	"log/slog"
	"strconv"
	"strings"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
)

const xpPerWin = 100

// Resolver tracks live match scores and automatically resolves predictions
// when a match disappears from the live feed (indicating it finished).
type Resolver struct {
	db        *pgxpool.Pool
	mu        sync.Mutex
	prevSeen  map[string]bool
	currSeen  map[string]bool
	lastScore map[string]string
}

func NewResolver(db *pgxpool.Pool) *Resolver {
	return &Resolver{
		db:        db,
		prevSeen:  make(map[string]bool),
		currSeen:  make(map[string]bool),
		lastScore: make(map[string]string),
	}
}

// BeginCycle snapshots the previous seen set and resets the current one.
// Call once at the start of each live refresh cycle.
func (r *Resolver) BeginCycle() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.prevSeen = r.currSeen
	r.currSeen = make(map[string]bool)
}

// RecordEvent marks an event as live in the current cycle.
// If a score is provided, it is stored as the last known score for that event.
func (r *Resolver) RecordEvent(eventID string, score *string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.currSeen[eventID] = true
	if score != nil && *score != "" {
		r.lastScore[eventID] = *score
	}
}

// EndCycle resolves predictions for events that were live in the previous cycle
// but have now disappeared (i.e., the match finished).
func (r *Resolver) EndCycle(ctx context.Context) {
	r.mu.Lock()
	toResolve := map[string]string{}
	for id := range r.prevSeen {
		if !r.currSeen[id] {
			if sc, ok := r.lastScore[id]; ok {
				toResolve[id] = sc
				delete(r.lastScore, id)
			}
		}
	}
	r.mu.Unlock()

	if len(toResolve) == 0 {
		return
	}

	for eventID, score := range toResolve {
		h, a, ok := parseMatchScore(score)
		if !ok {
			continue
		}
		outcome := outcomeFromScore(h, a)
		if err := r.resolvePredictions(ctx, eventID, outcome); err != nil {
			slog.Warn("resolver: failed to resolve event", "event_id", eventID, "err", err)
		}
	}
}

func (r *Resolver) resolvePredictions(ctx context.Context, eventID, actualOutcome string) error {
	rows, err := r.db.Query(ctx,
		`SELECT id, user_id, outcome FROM predictions WHERE event_id = $1 AND status = 'waiting'`,
		eventID)
	if err != nil {
		return err
	}
	defer rows.Close()

	type predRow struct{ id, userID, outcome string }
	var preds []predRow
	for rows.Next() {
		var p predRow
		if err := rows.Scan(&p.id, &p.userID, &p.outcome); err != nil {
			continue
		}
		preds = append(preds, p)
	}
	rows.Close()

	if len(preds) == 0 {
		return nil
	}

	slog.Info("resolver: resolving event", "event_id", eventID, "outcome", actualOutcome, "count", len(preds))

	for _, p := range preds {
		win := p.outcome == actualOutcome
		status := "loss"
		points := 0
		if win {
			status = "win"
			points = xpPerWin
		}

		tx, err := r.db.Begin(ctx)
		if err != nil {
			slog.Warn("resolver: begin tx failed", "err", err)
			continue
		}

		if _, err := tx.Exec(ctx,
			`UPDATE predictions SET status = $1, points = $2 WHERE id = $3`,
			status, points, p.id,
		); err != nil {
			tx.Rollback(ctx)
			continue
		}

		if win {
			if _, err := tx.Exec(ctx,
				`UPDATE leaderboard SET total_points = total_points + $1, wins = wins + 1, updated_at = now()
				 WHERE user_id = $2 AND period = 'all'`,
				points, p.userID,
			); err != nil {
				tx.Rollback(ctx)
				continue
			}
			if _, err := tx.Exec(ctx,
				`UPDATE users SET points = (
				   SELECT total_points FROM leaderboard WHERE user_id = $1 AND period = 'all'
				 ) WHERE id = $1`,
				p.userID,
			); err != nil {
				tx.Rollback(ctx)
				continue
			}
		} else {
			if _, err := tx.Exec(ctx,
				`UPDATE leaderboard SET losses = losses + 1, updated_at = now()
				 WHERE user_id = $1 AND period = 'all'`,
				p.userID,
			); err != nil {
				tx.Rollback(ctx)
				continue
			}
		}

		if err := tx.Commit(ctx); err != nil {
			slog.Warn("resolver: commit failed", "err", err)
			continue
		}
		slog.Info("prediction resolved", "id", p.id, "user_id", p.userID, "status", status, "xp", points)
	}

	if _, err := r.db.Exec(ctx,
		`UPDATE leaderboard l
		 SET rank = sub.new_rank
		 FROM (
		   SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC) AS new_rank
		   FROM leaderboard WHERE period = 'all'
		 ) sub
		 WHERE l.user_id = sub.user_id AND l.period = 'all'`); err != nil {
		slog.Warn("resolver: rank recalculation failed", "err", err)
	}

	return nil
}

func parseMatchScore(score string) (home, away int, ok bool) {
	parts := strings.SplitN(score, "-", 2)
	if len(parts) != 2 {
		return 0, 0, false
	}
	h, err1 := strconv.Atoi(strings.TrimSpace(parts[0]))
	a, err2 := strconv.Atoi(strings.TrimSpace(parts[1]))
	if err1 != nil || err2 != nil {
		return 0, 0, false
	}
	return h, a, true
}

func outcomeFromScore(homeScore, awayScore int) string {
	if homeScore > awayScore {
		return "home"
	}
	if homeScore < awayScore {
		return "away"
	}
	return "draw"
}
