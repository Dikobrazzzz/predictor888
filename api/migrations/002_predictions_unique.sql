CREATE UNIQUE INDEX IF NOT EXISTS uq_predictions_user_event
    ON predictions (user_id, event_id);
