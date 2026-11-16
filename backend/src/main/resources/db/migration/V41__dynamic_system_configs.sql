-- Migration V41: Unified Dynamic System Configurations (key-value runtime settings)

CREATE TABLE IF NOT EXISTS dynamic_system_configs (
    id UUID NOT NULL PRIMARY KEY,
    config_key VARCHAR(120) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    default_value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    description VARCHAR(500) NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by VARCHAR(150) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dynamic_system_configs_category
    ON dynamic_system_configs (category);

CREATE INDEX IF NOT EXISTS idx_dynamic_system_configs_public
    ON dynamic_system_configs (is_public, is_secret);

INSERT INTO dynamic_system_configs (
    id, config_key, config_value, default_value, category, description, is_public, is_secret, is_deleted, is_active, created_at, updated_at
) VALUES
    ('11111111-1111-1111-1111-111111111201', 'client.base_url', 'http://localhost:5173', 'http://localhost:5173', 'GENERAL', 'Frontend Web Application Base URL for emails and redirect links', TRUE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-111111111202', 'auth.signup_otp_expiry_minutes', '10', '10', 'AUTH', 'Signup email verification OTP validity duration in minutes', FALSE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-111111111203', 'auth.password_reset_expiry_minutes', '15', '15', 'AUTH', 'Password reset challenge token validity duration in minutes', FALSE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-111111111204', 'auth.otp_max_attempts', '5', '5', 'AUTH', 'Maximum failed OTP verification attempts before code is invalidated', FALSE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-111111111205', 'user.username_cooldown_days', '14', '14', 'USER', 'Cooldown window in days between consecutive username modifications', TRUE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-111111111206', 'user.max_accounts_per_email', '3', '3', 'USER', 'Maximum secondary user accounts allowed per primary email address (1-3)', TRUE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-111111111207', 'user.account_deletion_grace_days', '15', '15', 'USER', 'Grace period in days to recover a soft-deleted user account', TRUE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-111111111208', 'mail.from_address', 'no-reply@instagram.com', 'no-reply@instagram.com', 'NOTIFICATIONS', 'Default system email sender address', FALSE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-111111111209', 'mail.from_name', 'Instagram', 'Instagram', 'NOTIFICATIONS', 'Default system email sender display name', FALSE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-111111111210', 'security.lockout_max_attempts', '5', '5', 'SECURITY', 'Consecutive failed login attempts triggering account lockout', FALSE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-111111111211', 'security.lockout_duration_minutes', '15', '15', 'SECURITY', 'Account lockout temporary suspension window in minutes', FALSE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (config_key) DO NOTHING;

