package com.instagramclone.mail.constants;

/**
 * Domain constants for email templates, dispatch, and unsubscribe tokens.
 */
public final class MailConstants {

    private MailConstants() {
        // Prevent instantiation
    }

    public static final String DEFAULT_FROM_NAME = "Instagram Clone";


    // ==================== ERROR MESSAGES ====================
    public static final String ERR_CANNOT_UNSUBSCRIBE_MANDATORY = "Cannot unsubscribe from mandatory security or account notifications";
    public static final String ERR_UNSUBSCRIBE_LINK_EXPIRED = "Unsubscribe link has expired";
    public static final String ERR_INVALID_UNSUBSCRIBE_SIGNATURE = "Invalid unsubscribe signature";
    public static final String ERR_HMAC_SIGNATURE_FAILED = "Failed computing HMAC signature for unsubscribe token";

    // ==================== DTO VALIDATION CONSTANTS & BOUNDS ====================

    // Dynamic Email Config Validation
    public static final String VALIDATION_EMAIL_CATEGORY_REQUIRED = "Email category/purpose is required";
    public static final String VALIDATION_FROM_EMAIL_REQUIRED = "Sender from email is required";
    public static final String VALIDATION_FROM_EMAIL_INVALID_MESSAGE = "From email must be a valid email address";
    public static final int EMAIL_FIELD_MAX_LENGTH = 255;
    public static final String VALIDATION_FROM_EMAIL_MAX_LENGTH_MESSAGE = "From email cannot exceed 255 characters";
    public static final String VALIDATION_SENDER_NAME_REQUIRED = "Sender name is required";
    public static final int SENDER_NAME_MAX_LENGTH = 100;
    public static final String VALIDATION_SENDER_NAME_MAX_LENGTH_MESSAGE = "Sender name cannot exceed 100 characters";
    public static final int PURPOSE_NAME_MAX_LENGTH = 100;
    public static final String VALIDATION_PURPOSE_NAME_MAX_LENGTH_MESSAGE = "Purpose name cannot exceed 100 characters";
    public static final int DESCRIPTION_MAX_LENGTH = 255;
    public static final String VALIDATION_DESCRIPTION_MAX_LENGTH_MESSAGE = "Description cannot exceed 255 characters";
    public static final String VALIDATION_REPLY_TO_INVALID_MESSAGE = "Reply-to must be a valid email address if provided";
    public static final String VALIDATION_REPLY_TO_MAX_LENGTH_MESSAGE = "Reply-to cannot exceed 255 characters";

    // Dynamic Email Template Validation
    public static final String VALIDATION_EMAIL_TYPE_REQUIRED = "Email type is required";
    public static final String VALIDATION_SUBJECT_TEMPLATE_REQUIRED = "Template subject is required";
    public static final int SUBJECT_TEMPLATE_MAX_LENGTH = 255;
    public static final String VALIDATION_SUBJECT_TEMPLATE_MAX_LENGTH_MESSAGE = "Subject template cannot exceed 255 characters";
    public static final String VALIDATION_BODY_HTML_TEMPLATE_REQUIRED = "HTML body template is required";
    public static final int TEMPLATE_NAME_MAX_LENGTH = 100;
    public static final String VALIDATION_TEMPLATE_NAME_MAX_LENGTH_MESSAGE = "Template name cannot exceed 100 characters";

    // Email Server Config Validation
    public static final String VALIDATION_PROVIDER_NAME_REQUIRED = "Provider name is required";
    public static final String VALIDATION_SMTP_HOST_REQUIRED = "SMTP host is required";
    public static final String VALIDATION_SMTP_PORT_REQUIRED = "SMTP port is required";
    public static final int SMTP_PORT_MIN = 1;
    public static final int SMTP_PORT_MAX = 65535;
    public static final String VALIDATION_SMTP_PORT_MIN_MESSAGE = "Port must be greater than 0";
    public static final String VALIDATION_SMTP_PORT_MAX_MESSAGE = "Port must be at most 65535";
    public static final String VALIDATION_AUTH_ENABLED_REQUIRED = "authEnabled flag is required";
    public static final String VALIDATION_STARTTLS_ENABLED_REQUIRED = "starttlsEnabled flag is required";
    public static final String VALIDATION_SSL_ENABLED_REQUIRED = "sslEnabled flag is required";
    public static final String VALIDATION_CONNECTION_TIMEOUT_REQUIRED = "connectionTimeoutMs is required";
    public static final int CONNECTION_TIMEOUT_MS_MIN = 1000;
    public static final String VALIDATION_CONNECTION_TIMEOUT_MIN_MESSAGE = "Connection timeout must be at least 1000ms";
    public static final String VALIDATION_SIMULATION_MODE_REQUIRED = "simulationMode flag is required";
    public static final String VALIDATION_RATE_LIMIT_PER_HOUR_REQUIRED = "rateLimitPerHour is required";
    public static final int RATE_LIMIT_PER_HOUR_MIN = 1;
    public static final String VALIDATION_RATE_LIMIT_MIN_MESSAGE = "Rate limit must be at least 1";

    // Test Email Config Validation
    public static final String VALIDATION_RECIPIENT_EMAIL_REQUIRED = "Recipient email is required";
    public static final String VALIDATION_RECIPIENT_EMAIL_INVALID_MESSAGE = "Recipient must be a valid email address";
}
