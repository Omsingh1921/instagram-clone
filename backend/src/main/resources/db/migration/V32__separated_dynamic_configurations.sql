-- Migration V32: Separated Dynamic Configurations for Admin Platform Control

-- 1. Dynamic Email Server & SMTP Provider Configuration
CREATE TABLE IF NOT EXISTS dynamic_email_server_configs (
    id UUID NOT NULL PRIMARY KEY,
    provider_name VARCHAR(50) NOT NULL DEFAULT 'SMTP',
    host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
    port INT NOT NULL DEFAULT 587,
    username VARCHAR(255) NULL,
    password VARCHAR(255) NULL,
    auth_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    starttls_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ssl_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    connection_timeout_ms INT NOT NULL DEFAULT 10000,
    simulation_mode BOOLEAN NOT NULL DEFAULT TRUE,
    rate_limit_per_hour INT NOT NULL DEFAULT 1000,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO dynamic_email_server_configs (
    id, provider_name, host, port, username, password, auth_enabled, starttls_enabled, ssl_enabled, connection_timeout_ms, simulation_mode, rate_limit_per_hour, is_deleted, is_active, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111101', 'SMTP', 'smtp.gmail.com', 587, '', '', TRUE, TRUE, FALSE, 10000, TRUE, 1000, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 2. Deletion & Data Lifecycle Configuration
CREATE TABLE IF NOT EXISTS dynamic_deletion_configs (
    id UUID NOT NULL PRIMARY KEY,
    trash_retention_days INT NOT NULL DEFAULT 30,
    pseudo_permanent_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    media_purge_delay_days INT NOT NULL DEFAULT 30,
    legal_hold_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    admin_takedown_preserve_days INT NOT NULL DEFAULT 365,
    account_grace_days INT NOT NULL DEFAULT 30,
    cron_batch_size INT NOT NULL DEFAULT 500,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO dynamic_deletion_configs (
    id, trash_retention_days, pseudo_permanent_enabled, media_purge_delay_days, legal_hold_enabled, admin_takedown_preserve_days, account_grace_days, cron_batch_size, is_deleted, is_active, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111102', 30, TRUE, 30, FALSE, 365, 30, 500, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 3. Media & Uploads Configuration
CREATE TABLE IF NOT EXISTS dynamic_media_configs (
    id UUID NOT NULL PRIMARY KEY,
    max_reel_bytes BIGINT NOT NULL DEFAULT 262144000,
    max_post_bytes BIGINT NOT NULL DEFAULT 104857600,
    max_reel_duration_sec INT NOT NULL DEFAULT 90,
    max_story_duration_sec INT NOT NULL DEFAULT 60,
    allowed_mime_types VARCHAR(500) NOT NULL DEFAULT 'video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO dynamic_media_configs (
    id, max_reel_bytes, max_post_bytes, max_reel_duration_sec, max_story_duration_sec, allowed_mime_types, is_deleted, is_active, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111103', 262144000, 104857600, 90, 60, 'video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 4. Platform Feature Flags & Maintenance
CREATE TABLE IF NOT EXISTS dynamic_feature_flags (
    id UUID NOT NULL PRIMARY KEY,
    reels_upload_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    story_creation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    voice_messages_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    maintenance_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    maintenance_message VARCHAR(500) NOT NULL DEFAULT 'Instagram is currently undergoing scheduled maintenance. Please check back shortly.',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO dynamic_feature_flags (
    id, reels_upload_enabled, story_creation_enabled, voice_messages_enabled, maintenance_mode_enabled, maintenance_message, is_deleted, is_active, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111104', TRUE, TRUE, TRUE, FALSE, 'Instagram is currently undergoing scheduled maintenance. Please check back shortly.', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 5. Moderation & Safety Configuration
CREATE TABLE IF NOT EXISTS dynamic_moderation_configs (
    id UUID NOT NULL PRIMARY KEY,
    auto_quarantine_report_threshold INT NOT NULL DEFAULT 5,
    profanity_banned_words TEXT NOT NULL DEFAULT 'spam,scam,fraud,hate,abuse,harassment,malware',
    nsfw_blur_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    copyright_strike_limit INT NOT NULL DEFAULT 3,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO dynamic_moderation_configs (
    id, auto_quarantine_report_threshold, profanity_banned_words, nsfw_blur_threshold, copyright_strike_limit, is_deleted, is_active, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111105', 5, 'spam,scam,fraud,hate,abuse,harassment,malware', 0.85, 3, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;
