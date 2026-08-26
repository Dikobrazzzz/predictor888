-- Последний известный счёт по событию.
--
-- Раньше резолвер держал счёт только в памяти и закрывал прогнозы в момент,
-- когда матч пропадал из live-выдачи. Любой рестарт сервиса стирал это
-- состояние, и матчи, шедшие в тот момент, не закрывались уже никогда —
-- прогнозы навсегда оставались в статусе waiting.
--
-- Теперь состояние переживает рестарт, а догоняющий проход (Resolver.Sweep)
-- закрывает всё, что зависло.
CREATE TABLE IF NOT EXISTS event_scores (
    event_id     TEXT PRIMARY KEY,
    score        TEXT NOT NULL DEFAULT '',
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_scores_seen ON event_scores (last_seen_at);

-- predictions.status получает четвёртое значение — 'void': матч так и не
-- принёс счёта (пропал из выдачи, отменён), прогноз закрыт без начисления
-- и без записи в поражения. CHECK-ограничения на колонке нет, миграция данных
-- не требуется.

CREATE INDEX IF NOT EXISTS idx_predictions_waiting
    ON predictions (status, event_id) WHERE status = 'waiting';
