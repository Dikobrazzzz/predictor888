-- Привязка Player ID (888starz) к аккаунту Telegram.
-- Экран Telegram ID_375 и его состояния ошибок опираются на две уникальности:
--   player_id       -- «This Player ID is already linked to another Telegram account»
--   telegram_user_id -- один Telegram не может держать несколько Player ID
CREATE TABLE IF NOT EXISTS telegram_links (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id        TEXT NOT NULL,
    telegram_user_id TEXT NOT NULL,
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_telegram_links_player
    ON telegram_links (player_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_telegram_links_tg
    ON telegram_links (telegram_user_id);

CREATE INDEX IF NOT EXISTS idx_telegram_links_user
    ON telegram_links (user_id);
