-- Квесты и промокоды (экраны Quests_All_375, Quests_Locked/Complete, Promo).
--
-- Прогресс считается понедельно. Начало недели — понедельник 00:00 UTC,
-- ключ периода хранится как дата понедельника (period_start).

-- ── Квесты ────────────────────────────────────────────────────────────────
-- metric определяет, откуда берётся прогресс:
--   predictions_made  -- число прогнозов за неделю
--   predictions_won   -- число выигранных прогнозов за неделю
--   xp_earned         -- XP, набранный за неделю
--   tokens_spent      -- потрачено токенов (системы токенов пока нет)
--   login_streak      -- дней подряд с заходом (трекинга пока нет)
CREATE TABLE IF NOT EXISTS quests (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         TEXT UNIQUE NOT NULL,
    metric       TEXT NOT NULL,
    target       INT  NOT NULL CHECK (target > 0),
    reward_kind  TEXT NOT NULL DEFAULT 'xp',      -- 'xp' | 'tokens'
    reward_value INT  NOT NULL DEFAULT 0,
    sort_order   INT  NOT NULL DEFAULT 0,
    active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- Прогресс пользователя по квесту в конкретную неделю.
-- Для вычисляемых метрик строка нужна как отметка о выдаче награды,
-- для накопительных (tokens_spent, login_streak) — ещё и как хранилище progress.
CREATE TABLE IF NOT EXISTS user_quests (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id     UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    progress     INT  NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    rewarded_at  TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_quests
    ON user_quests (user_id, quest_id, period_start);
CREATE INDEX IF NOT EXISTS idx_user_quests_period
    ON user_quests (user_id, period_start);

-- Недельная награда за все квесты: одна строка на пользователя и неделю.
CREATE TABLE IF NOT EXISTS weekly_rewards (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    claimed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_weekly_rewards
    ON weekly_rewards (user_id, period_start);

-- ── Промокоды ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT UNIQUE NOT NULL,
    game        TEXT NOT NULL DEFAULT '',   -- 'gates' | 'aviator' — для подбора арта
    reward_text TEXT NOT NULL DEFAULT '',   -- запасной текст, если нет ключа перевода
    sort_order  INT  NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    starts_at   TIMESTAMPTZ,
    ends_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_active
    ON promo_codes (active, sort_order);

CREATE TABLE IF NOT EXISTS promo_claims (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    claimed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_promo_claims
    ON promo_claims (user_id, promo_code_id);

-- ── Наполнение по макету ──────────────────────────────────────────────────
INSERT INTO quests (code, metric, target, reward_kind, reward_value, sort_order) VALUES
    ('make_3_predictions', 'predictions_made', 3,   'xp',     50,  1),
    ('predict_2_correct',  'predictions_won',  2,   'xp',     120, 2),
    ('spend_10_tokens',    'tokens_spent',     10,  'xp',     80,  3),
    ('login_5_days',       'login_streak',     5,   'tokens', 5,   4),
    ('reach_500_xp',       'xp_earned',        500, 'tokens', 10,  5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO promo_codes (code, game, reward_text, sort_order) VALUES
    ('UZ150FS',   'gates',   'Get 100 free spins in Gates of Olympus', 1),
    ('UZAVIATOR', 'aviator', 'Get 100 free spins in Aviator',          2)
ON CONFLICT (code) DO NOTHING;
