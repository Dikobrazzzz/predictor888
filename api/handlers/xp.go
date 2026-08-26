package handlers

import (
	"context"

	"github.com/jackc/pgx/v5/pgconn"
)

// execer покрывает и пул, и транзакцию: XP начисляется из обоих контекстов.
type execer interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

// addXP — единственное место, где меняется баланс XP.
//
// Источник истины — leaderboard.total_points, а users.points держим его
// зеркалом. Раньше квесты писали напрямую в users.points, и резолвер прогнозов
// после каждой победы перезаписывал это поле значением из leaderboard,
// то есть молча стирал все начисления за квесты.
func addXP(ctx context.Context, q execer, userID string, delta int) error {
	if _, err := q.Exec(ctx,
		`INSERT INTO leaderboard (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
		userID,
	); err != nil {
		return err
	}
	if _, err := q.Exec(ctx,
		`UPDATE leaderboard SET total_points = total_points + $1, updated_at = now()
		 WHERE user_id = $2`,
		delta, userID,
	); err != nil {
		return err
	}
	_, err := q.Exec(ctx,
		`UPDATE users SET points = (SELECT total_points FROM leaderboard WHERE user_id = $1)
		 WHERE id = $1`,
		userID,
	)
	return err
}
