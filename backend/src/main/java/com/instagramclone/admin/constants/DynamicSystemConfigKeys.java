package com.instagramclone.admin.constants;

/**
 * Canonical keys and defaults for runtime-editable system configurations.
 */
public final class DynamicSystemConfigKeys {

    private DynamicSystemConfigKeys() {
    }

    public static final String CLIENT_BASE_URL = "client.base_url";
    public static final String AUTH_SIGNUP_OTP_EXPIRY_MINUTES = "auth.signup_otp_expiry_minutes";
    public static final String AUTH_PASSWORD_RESET_EXPIRY_MINUTES = "auth.password_reset_expiry_minutes";
    public static final String AUTH_OTP_MAX_ATTEMPTS = "auth.otp_max_attempts";
    public static final String USER_USERNAME_COOLDOWN_DAYS = "user.username_cooldown_days";
    public static final String USER_MAX_ACCOUNTS_PER_EMAIL = "user.max_accounts_per_email";
    public static final String USER_ACCOUNT_DELETION_GRACE_DAYS = "user.account_deletion_grace_days";
    public static final String MAIL_FROM_ADDRESS = "mail.from_address";
    public static final String MAIL_FROM_NAME = "mail.from_name";
    public static final String SECURITY_LOCKOUT_MAX_ATTEMPTS = "security.lockout_max_attempts";
    public static final String SECURITY_LOCKOUT_DURATION_MINUTES = "security.lockout_duration_minutes";

    public static final String DEFAULT_CLIENT_BASE_URL = "http://localhost:5173";
}

