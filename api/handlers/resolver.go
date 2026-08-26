package handlers

import (
	"context"
	"log/slog"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const xpPerWin = 100

// Пороги догоняющего прохода.
const (
	// Через сколько после начала матча прогноз считается зависшим.
	sweepStaleAfter = 4 * time.Hour
	// Сколько ждём, прежде чем закрыть событие по последнему известному счёту:
	// защита от того, чтобы не закрыть матч, который всё ещё идёт.
	sweepScoreIdle = 20 * time.Minute
	// Через сколько прогноз без единого известного счёта аннулируется.
	sweepVoidAfter = 24 * time.Hour
	// Как часто крутится догоняющий проход.
	SweepInterval = 10 * time.Minute
)

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

	r.persistScores(ctx)

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
				`UPDATE leaderboard SET wins = wins + 1, updated_at = now() WHERE user_id = $1`,
				p.userID,
			); err != nil {
				tx.Rollback(ctx)
				continue
			}
			if err := addXP(ctx, tx, p.userID, points); err != nil {
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

// persistScores сохраняет счёт по всем событиям текущего цикла, чтобы
// состояние пережило рестарт сервиса.
func (r *Resolver) persistScores(ctx context.Context) {
	r.mu.Lock()
	batch := make([][2]string, 0, len(r.currSeen))
	for id := range r.currSeen {
		batch = append(batch, [2]string{id, r.lastScore[id]})
	}
	r.mu.Unlock()

	for _, row := range batch {
		if _, err := r.db.Exec(ctx,
			`INSERT INTO event_scores (event_id, score, last_seen_at) VALUES ($1, $2, now())
			 ON CONFLICT (event_id) DO UPDATE
			    SET score = CASE WHEN EXCLUDED.score <> '' THEN EXCLUDED.score ELSE event_scores.score END,
			        last_seen_at = now()`,
			row[0], row[1],
		); err != nil {
			slog.Warn("resolver: persist score failed", "event_id", row[0], "err", err)
			return
		}
	}
}

// Restore поднимает состояние из базы при старте. Без этого после рестарта
// prevSeen пуст, и матчи, шедшие в момент перезапуска, не закрываются никогда.
func (r *Resolver) Restore(ctx context.Context) {
	rows, err := r.db.Query(ctx,
		`SELECT event_id, score FROM event_scores WHERE last_seen_at > now() - interval '24 hours'`)
	if err != nil {
		slog.Warn("resolver: restore failed", "err", err)
		return
	}
	defer rows.Close()

	r.mu.Lock()
	defer r.mu.Unlock()
	n := 0
	for rows.Next() {
		var id, score string
		if err := rows.Scan(&id, &score); err != nil {
			continue
		}
		if score != "" {
			r.lastScore[id] = score
		}
		// Событие считалось живым до рестарта: если его нет в текущей выдаче,
		// первый же EndCycle его закроет.
		r.prevSeen[id] = true
		n++
	}
	slog.Info("resolver: state restored", "events", n)
}

// Sweep — догоняющий проход по зависшим прогнозам. Закрывает то, что резолвер
// пропустил: матч исчез из выдачи незамеченным, сервис перезапустился,
// событие вообще не вернулось.
func (r *Resolver) Sweep(ctx context.Context) {
	rows, err := r.db.Query(ctx, `
		SELECT p.event_id,
		       COALESCE(s.score, ''),
		       COALESCE(s.last_seen_at, 'epoch'::timestamptz),
		       MIN(COALESCE(p.starts_at, p.created_at))
		FROM predictions p
		LEFT JOIN event_scores s ON s.event_id = p.event_id
		WHERE p.status = 'waiting'
		  AND COALESCE(p.starts_at, p.created_at) < now() - make_interval(secs => $1)
		GROUP BY p.event_id, s.score, s.last_seen_at`,
		sweepStaleAfter.Seconds())
	if err != nil {
		slog.Warn("resolver: sweep query failed", "err", err)
		return
	}

	type stale struct {
		eventID  string
		score    string
		lastSeen time.Time
		oldest   time.Time
	}
	var list []stale
	for rows.Next() {
		var st stale
		if err := rows.Scan(&st.eventID, &st.score, &st.lastSeen, &st.oldest); err != nil {
			continue
		}
		list = append(list, st)
	}
	rows.Close()

	now := time.Now()
	for _, st := range list {
		h, a, ok := parseMatchScore(st.score)
		if ok && now.Sub(st.lastSeen) > sweepScoreIdle {
			slog.Info("resolver: sweeping by last known score", "event_id", st.eventID, "score", st.score)
			if err := r.resolvePredictions(ctx, st.eventID, outcomeFromScore(h, a)); err != nil {
				slog.Warn("resolver: sweep resolve failed", "event_id", st.eventID, "err", err)
			}
			continue
		}
		if !ok && now.Sub(st.oldest) > sweepVoidAfter {
			r.voidPredictions(ctx, st.eventID)
		}
	}
}

// voidPredictions закрывает прогнозы по событию, счёт которого так и не стал
// известен. Ни XP, ни поражения — исход неизвестен, наказывать не за что.
func (r *Resolver) voidPredictions(ctx context.Context, eventID string) {
	tag, err := r.db.Exec(ctx,
		`UPDATE predictions SET status = 'void', points = 0
		 WHERE event_id = $1 AND status = 'waiting'`, eventID)
	if err != nil {
		slog.Warn("resolver: void failed", "event_id", eventID, "err", err)
		return
	}
	if tag.RowsAffected() > 0 {
		slog.Info("resolver: predictions voided", "event_id", eventID, "count", tag.RowsAffected())
	}
}
