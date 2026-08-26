-- Top Picks: прогнозы амбассадора (экраны Events_Top Picks_375 и Top Picks_375).
--
-- Плюс время начала матча в прогнозах: карточка Vote_Card показывает
-- «Premier League • today 20:45», а в predictions была только дата создания.

CREATE TABLE IF NOT EXISTS analysts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT '',   -- «Sport Analyst»
    avatar_url  TEXT NOT NULL DEFAULT '',
    accuracy    INT  NOT NULL DEFAULT 0,    -- процент верных прогнозов за сезон
    instagram   TEXT NOT NULL DEFAULT '',
    active      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS top_picks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analyst_id  UUID NOT NULL REFERENCES analysts(id) ON DELETE CASCADE,
    event_id    TEXT NOT NULL DEFAULT '',
    league      TEXT NOT NULL DEFAULT '',
    home_team   TEXT NOT NULL DEFAULT '',
    away_team   TEXT NOT NULL DEFAULT '',
    comment     TEXT NOT NULL DEFAULT '',
    outcome     TEXT NOT NULL,              -- 'home' | 'draw' | 'away'
    odds        NUMERIC(6,2) NOT NULL DEFAULT 0,
    starts_at   TIMESTAMPTZ,
    featured    BOOLEAN NOT NULL DEFAULT FALSE,  -- «Pick of the day»
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_top_picks_active
    ON top_picks (active, featured DESC, starts_at);

-- Только один «пик дня» одновременно.
CREATE UNIQUE INDEX IF NOT EXISTS uq_top_picks_featured
    ON top_picks (featured) WHERE featured AND active;

-- Время начала матча для карточек «My prediction».
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
