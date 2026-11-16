-- V43: Add break reminder setting and per-user daily screen time tracking
ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS break_reminder_minutes INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_daily_screen_time (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    usage_date DATE NOT NULL,
    active_seconds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_daily_screen_time_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_daily_screen_time_user_date UNIQUE (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_screen_time_user_date
    ON user_daily_screen_time (user_id, usage_date);

