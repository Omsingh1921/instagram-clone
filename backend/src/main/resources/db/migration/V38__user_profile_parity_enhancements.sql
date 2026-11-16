-- Flyway Migration: V38__user_profile_parity_enhancements.sql
-- Description: Add pronouns, gender, professional contact options, verified badge, and username cooldown fields.

-- 1. Evolve users table
ALTER TABLE users
    ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN previous_username VARCHAR(50) NULL,
    ADD COLUMN username_last_changed_at TIMESTAMP NULL;

CREATE INDEX idx_users_previous_username ON users(previous_username);

-- 2. Evolve profiles table
ALTER TABLE profiles
    ADD COLUMN pronouns VARCHAR(50) NULL,
    ADD COLUMN gender VARCHAR(30) NULL,
    ADD COLUMN show_category_badge BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN contact_email VARCHAR(255) NULL,
    ADD COLUMN contact_phone VARCHAR(50) NULL,
    ADD COLUMN show_contact_info BOOLEAN NOT NULL DEFAULT FALSE;

