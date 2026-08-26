-- Токены (вторая валюта рядом с XP) и отметки визитов.
-- Нужны для квестов «Spend 10 tokens» и «Login 5 days in a row»,
-- а также для счётчика монет в шапке.

-- Текущий баланс держим на пользователе, историю — в журнале.
ALTER TABLE users ADD COLUMN IF NOT EXISTS tokens INT NOT NULL DEFAULT 0;

-- amount > 0 — начисление, amount < 0 — списание.
CREATE TABLE IF NOT EXISTS token_transactions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount     INT  NOT NULL CHECK (amount <> 0),
    reason     TEXT NOT NULL DEFAULT '',
    ref        TEXT NOT NULL DEFAULT '',   -- к чему привязано: код квеста, промо и т.п.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_tx_user
    ON token_transactions (user_id, created_at DESC);

-- Одна строка на пользователя и календарный день (UTC).
CREATE TABLE IF NOT EXISTS user_visits (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    PRIMARY KEY (user_id, visit_date)
);

CREATE INDEX IF NOT EXISTS idx_user_visits_date
    ON user_visits (user_id, visit_date DESC);
