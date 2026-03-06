CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT UNIQUE NOT NULL,
    login      TEXT UNIQUE NOT NULL,
    region     TEXT NOT NULL DEFAULT '',
    points     INT  NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE TABLE IF NOT EXISTS predictions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id   TEXT NOT NULL,
    sport      TEXT NOT NULL DEFAULT '',
    league     TEXT NOT NULL DEFAULT '',
    home_team  TEXT NOT NULL DEFAULT '',
    away_team  TEXT NOT NULL DEFAULT '',
    outcome    TEXT NOT NULL,       -- 'home', 'draw', 'away'
    points     INT  NOT NULL DEFAULT 0,
    status     TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'win', 'loss'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions (user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_event ON predictions (event_id);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions (status);

CREATE TABLE IF NOT EXISTS leaderboard (
    user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points INT  NOT NULL DEFAULT 0,
    wins         INT  NOT NULL DEFAULT 0,
    losses       INT  NOT NULL DEFAULT 0,
    rank         INT  NOT NULL DEFAULT 0,
    period       TEXT NOT NULL DEFAULT 'all', -- 'all', 'weekly', 'monthly'
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard (rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard (total_points DESC);
