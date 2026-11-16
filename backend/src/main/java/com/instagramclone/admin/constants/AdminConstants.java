package com.instagramclone.admin.constants;

/**
 * Domain constants for Admin moderation, reports, and user account status enforcement.
 */
public final class AdminConstants {

    private AdminConstants() {
        // Prevent instantiation
    }

    public static final int MAX_REPORT_REASON_LENGTH = 1000;
    public static final int MAX_RESOLUTION_NOTES_LENGTH = 2000;
    public static final int DEFAULT_PAGE_SIZE = 25;
    public static final int DEFAULT_REPORT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;

    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String HAS_ROLE_ADMIN = "hasRole('ADMIN')";

    // ==================== ENDPOINT PATHS ====================
    public static final String BASE_PATH = "/api/v1";
    public static final String REPORTS_PATH = "/reports";
    public static final String ADMIN_REPORTS_PATH = "/admin/reports";
    public static final String ADMIN_REPORT_BY_ID_PATH = "/admin/reports/{reportId}";
    public static final String ADMIN_USER_STATUS_PATH = "/admin/users/{userId}/status";
    public static final String ADMIN_USERS_PATH = "/admin/users";
    public static final String ADMIN_DASHBOARD_STATS_PATH = "/admin/dashboard/stats";
    public static final String ADMIN_STATS_PATH = "/admin/stats";
    public static final String ADMIN_ACTIVITY_PATH = "/admin/activity";
    public static final String ADMIN_CONTENT_PATH = "/admin/content";
    public static final String ADMIN_CONTENT_DELETE_PATH = "/admin/content/{type}/{contentId}";
    public static final String ADMIN_EMAIL_CONFIGS_PATH = "/admin/email-configs";
    public static final String ADMIN_EMAIL_CONFIG_BY_CATEGORY_PATH = "/admin/email-configs/{category}";
    public static final String ADMIN_EMAIL_CONFIG_TEST_PATH = "/admin/email-configs/test";
    public static final String ADMIN_EMAIL_TEMPLATES_PATH = "/admin/email-templates";
    public static final String ADMIN_EMAIL_TEMPLATE_BY_TYPE_PATH = "/admin/email-templates/{emailType}";
    public static final String ADMIN_EMAIL_TEMPLATE_PREVIEW_PATH = "/admin/email-templates/preview";
    public static final String ADMIN_EMAIL_TEMPLATE_RESET_PATH = "/admin/email-templates/reset/{emailType}";

    public static final String ADMIN_EMAIL_SERVER_CONFIG_PATH = "/admin/email/server";
    public static final String ADMIN_EMAIL_SERVER_RESET_PATH = "/admin/email/server/reset";
    public static final String ADMIN_EMAIL_SERVER_TEST_PATH = "/admin/email/server/test";

    public static final String ADMIN_DELETION_CONFIG_PATH = "/admin/deletion/config";
    public static final String ADMIN_DELETION_CONFIG_RESET_PATH = "/admin/deletion/config/reset";

    public static final String ADMIN_MEDIA_CONFIG_PATH = "/admin/media/config";
    public static final String ADMIN_MEDIA_CONFIG_RESET_PATH = "/admin/media/config/reset";

    public static final String ADMIN_FEATURE_FLAGS_PATH = "/admin/features/config";
    public static final String ADMIN_FEATURE_FLAGS_RESET_PATH = "/admin/features/config/reset";

    public static final String ADMIN_MODERATION_CONFIG_PATH = "/admin/moderation/config";
    public static final String ADMIN_MODERATION_CONFIG_RESET_PATH = "/admin/moderation/config/reset";

    public static final String ADMIN_FEED_CONFIG_PATH = "/admin/feed/config";
    public static final String ADMIN_FEED_CONFIG_RESET_PATH = "/admin/feed/config/reset";

    public static final String ADMIN_DYNAMIC_CONFIG_PATH = "/admin/dynamic-config";
    public static final String ADMIN_DYNAMIC_CONFIG_BY_KEY_PATH = "/admin/dynamic-config/{key}";
    public static final String ADMIN_DYNAMIC_CONFIG_RESET_PATH = "/admin/dynamic-config/{key}/reset";
    public static final String ADMIN_DYNAMIC_CONFIG_RESET_ALL_PATH = "/admin/dynamic-config/reset";

    public static final String PUBLIC_MEDIA_CONFIG_PATH = "/media/config/public";
    public static final String PUBLIC_FEATURE_FLAGS_PATH = "/features/public";
    public static final String PUBLIC_DYNAMIC_CONFIG_PATH = "/dynamic-config/public";

    // ==================== SORT PROPERTIES ====================
    public static final String SORT_BY_CREATED_AT = "createdAt";

    // ==================== CONTROLLER SUCCESS MESSAGES ====================
    public static final String MSG_REPORT_SUBMITTED = "Report submitted successfully";
    public static final String MSG_REPORTS_RETRIEVED = "Reports retrieved successfully";
    public static final String MSG_REPORT_RETRIEVED = "Report retrieved successfully";
    public static final String MSG_REPORT_UPDATED = "Report updated successfully";
    public static final String MSG_USERS_RETRIEVED = "Users retrieved successfully";
    public static final String MSG_USER_STATUS_UPDATED = "User status updated successfully";
    public static final String MSG_STATS_RETRIEVED = "Admin dashboard statistics retrieved successfully";
    public static final String MSG_EMAIL_CONFIGS_RETRIEVED = "Email configurations retrieved successfully";
    public static final String MSG_EMAIL_CONFIG_RETRIEVED = "Email configuration retrieved successfully";
    public static final String MSG_EMAIL_CONFIG_UPDATED = "Email configuration updated successfully";
    public static final String MSG_TEST_EMAIL_SENT = "Test email dispatched successfully";
    public static final String MSG_EMAIL_TEMPLATES_RETRIEVED = "Email templates retrieved successfully";
    public static final String MSG_EMAIL_TEMPLATE_RETRIEVED = "Email template retrieved successfully";
    public static final String MSG_EMAIL_TEMPLATE_UPDATED = "Email template updated successfully";
    public static final String MSG_EMAIL_TEMPLATE_PREVIEWED = "Email template preview generated successfully";
    public static final String MSG_EMAIL_TEMPLATE_RESET = "Email template reset to default successfully";
    public static final String MSG_EMAIL_SERVER_CONFIG_RETRIEVED = "Email server configuration retrieved successfully";
    public static final String MSG_EMAIL_SERVER_CONFIG_UPDATED = "Email server configuration updated successfully";
    public static final String MSG_DELETION_CONFIG_RETRIEVED = "Deletion configuration retrieved successfully";
    public static final String MSG_DELETION_CONFIG_UPDATED = "Deletion configuration updated successfully";
    public static final String MSG_MEDIA_CONFIG_RETRIEVED = "Media configuration retrieved successfully";
    public static final String MSG_MEDIA_CONFIG_UPDATED = "Media configuration updated successfully";
    public static final String MSG_FEATURE_FLAGS_RETRIEVED = "Feature flags retrieved successfully";
    public static final String MSG_FEATURE_FLAGS_UPDATED = "Feature flags updated successfully";
    public static final String MSG_MODERATION_CONFIG_RETRIEVED = "Moderation configuration retrieved successfully";
    public static final String MSG_MODERATION_CONFIG_UPDATED = "Moderation configuration updated successfully";
    public static final String MSG_FEED_CONFIG_RETRIEVED = "Feed configuration retrieved successfully";
    public static final String MSG_FEED_CONFIG_UPDATED = "Feed configuration updated successfully";
    public static final String MSG_DYNAMIC_CONFIGS_RETRIEVED = "Dynamic system configurations retrieved successfully";
    public static final String MSG_DYNAMIC_CONFIG_UPDATED = "Dynamic system configuration updated successfully";
    public static final String MSG_DYNAMIC_CONFIG_RESET = "Dynamic system configuration reset to factory default";
    public static final String MSG_DYNAMIC_CONFIGS_RESET_ALL = "All dynamic system configurations reset to factory defaults";

    // ==================== SERVICE & BUSINESS ERROR MESSAGES ====================
    public static final String ERR_DYNAMIC_CONFIG_NOT_FOUND = "Dynamic configuration not found for key: ";
    public static final String ERR_REPORT_NOT_FOUND = "Report not found with ID: ";
    public static final String ERR_CANNOT_REPORT_SELF = "You cannot report your own content";
    public static final String ERR_REPORTER_NOT_FOUND = "Reporter user not found";
    public static final String ERR_REVIEWER_NOT_FOUND = "Reviewer user not found";
    public static final String ERR_USER_NOT_FOUND = "User not found with ID: ";
    public static final String ERR_CANNOT_MODIFY_OWN_STATUS = "Administrators cannot change their own account status";
    public static final String ERR_TARGET_CONTENT_NOT_FOUND = "Reported target content not found with ID: ";

    // ==================== DTO VALIDATION CONSTANTS & BOUNDS ====================

    // Reports Validation
    public static final String VALIDATION_TARGET_TYPE_REQUIRED = "Target type is required";
    public static final String VALIDATION_TARGET_ID_REQUIRED = "Target ID is required";
    public static final String VALIDATION_TARGET_ID_INVALID_UUID = "Target ID must be a valid UUID";
    public static final int MAX_REPORT_REASON_CODE_LENGTH = 50;
    public static final String VALIDATION_REASON_CODE_MAX_LENGTH_MESSAGE = "Reason code cannot exceed 50 characters";

    // Moderation Config Validation
    public static final String VALIDATION_AUTO_QUARANTINE_REQUIRED = "autoQuarantineReportThreshold is required";
    public static final int AUTO_QUARANTINE_THRESHOLD_MIN = 1;
    public static final int AUTO_QUARANTINE_THRESHOLD_MAX = 100;
    public static final String VALIDATION_AUTO_QUARANTINE_MIN_MESSAGE = "Threshold must be at least 1";
    public static final String VALIDATION_AUTO_QUARANTINE_MAX_MESSAGE = "Threshold cannot exceed 100";
    public static final String VALIDATION_PROFANITY_BANNED_WORDS_REQUIRED = "profanityBannedWords is required";
    public static final String VALIDATION_NSFW_BLUR_THRESHOLD_REQUIRED = "nsfwBlurThreshold is required";
    public static final String NSFW_BLUR_THRESHOLD_MIN = "0.0";
    public static final String NSFW_BLUR_THRESHOLD_MAX = "1.0";
    public static final String VALIDATION_NSFW_BLUR_MIN_MESSAGE = "NSFW blur threshold must be at least 0.0";
    public static final String VALIDATION_NSFW_BLUR_MAX_MESSAGE = "NSFW blur threshold cannot exceed 1.0";
    public static final String VALIDATION_COPYRIGHT_STRIKE_LIMIT_REQUIRED = "copyrightStrikeLimit is required";
    public static final int COPYRIGHT_STRIKE_LIMIT_MIN = 1;
    public static final int COPYRIGHT_STRIKE_LIMIT_MAX = 10;
    public static final String VALIDATION_COPYRIGHT_STRIKE_MIN_MESSAGE = "Strike limit must be at least 1";
    public static final String VALIDATION_COPYRIGHT_STRIKE_MAX_MESSAGE = "Strike limit cannot exceed 10";

    // Feature Flags Config Validation
    public static final String VALIDATION_REELS_UPLOAD_REQUIRED = "reelsUploadEnabled flag is required";
    public static final String VALIDATION_STORY_CREATION_REQUIRED = "storyCreationEnabled flag is required";
    public static final String VALIDATION_VOICE_MESSAGES_REQUIRED = "voiceMessagesEnabled flag is required";
    public static final String VALIDATION_MAINTENANCE_MODE_REQUIRED = "maintenanceModeEnabled flag is required";
    public static final String VALIDATION_MAINTENANCE_MESSAGE_REQUIRED = "maintenanceMessage is required";

    // Deletion Config Validation
    public static final String VALIDATION_TRASH_RETENTION_REQUIRED = "trashRetentionDays is required";
    public static final int TRASH_RETENTION_DAYS_MIN = 1;
    public static final int TRASH_RETENTION_DAYS_MAX = 365;
    public static final String VALIDATION_TRASH_RETENTION_MIN_MESSAGE = "Trash retention days must be at least 1";
    public static final String VALIDATION_TRASH_RETENTION_MAX_MESSAGE = "Trash retention days cannot exceed 365";
    public static final String VALIDATION_PSEUDO_PERMANENT_REQUIRED = "pseudoPermanentEnabled flag is required";
    public static final String VALIDATION_MEDIA_PURGE_DELAY_REQUIRED = "mediaPurgeDelayDays is required";
    public static final int MEDIA_PURGE_DELAY_DAYS_MIN = 0;
    public static final int MEDIA_PURGE_DELAY_DAYS_MAX = 365;
    public static final String VALIDATION_MEDIA_PURGE_DELAY_MIN_MESSAGE = "Media purge delay days cannot be negative";
    public static final String VALIDATION_MEDIA_PURGE_DELAY_MAX_MESSAGE = "Media purge delay days cannot exceed 365";
    public static final String VALIDATION_LEGAL_HOLD_REQUIRED = "legalHoldEnabled flag is required";
    public static final String VALIDATION_ADMIN_TAKEDOWN_PRESERVE_REQUIRED = "adminTakedownPreserveDays is required";
    public static final int ADMIN_TAKEDOWN_PRESERVE_DAYS_MIN = 1;
    public static final int ADMIN_TAKEDOWN_PRESERVE_DAYS_MAX = 3650;
    public static final String VALIDATION_ADMIN_TAKEDOWN_PRESERVE_MIN_MESSAGE = "Admin takedown preserve days must be at least 1";
    public static final String VALIDATION_ADMIN_TAKEDOWN_PRESERVE_MAX_MESSAGE = "Admin takedown preserve days cannot exceed 10 years";
    public static final String VALIDATION_ACCOUNT_GRACE_REQUIRED = "accountGraceDays is required";
    public static final int ACCOUNT_GRACE_DAYS_MIN = 0;
    public static final int ACCOUNT_GRACE_DAYS_MAX = 180;
    public static final String VALIDATION_ACCOUNT_GRACE_MIN_MESSAGE = "Account grace days cannot be negative";
    public static final String VALIDATION_ACCOUNT_GRACE_MAX_MESSAGE = "Account grace days cannot exceed 180";
    public static final String VALIDATION_CRON_BATCH_SIZE_REQUIRED = "cronBatchSize is required";
    public static final int CRON_BATCH_SIZE_MIN = 10;
    public static final int CRON_BATCH_SIZE_MAX = 5000;
    public static final String VALIDATION_CRON_BATCH_SIZE_MIN_MESSAGE = "Cron batch size must be at least 10";
    public static final String VALIDATION_CRON_BATCH_SIZE_MAX_MESSAGE = "Cron batch size cannot exceed 5000";

    // Feed Algorithm Config Validation
    public static final String VALIDATION_FEED_SHARE_WEIGHT_REQUIRED = "Share weight is required";
    public static final String FEED_WEIGHT_MIN = "0.0";
    public static final String FEED_WEIGHT_MAX = "20.0";
    public static final String VALIDATION_FEED_SHARE_WEIGHT_MIN_MESSAGE = "Share weight must be non-negative";
    public static final String VALIDATION_FEED_SHARE_WEIGHT_MAX_MESSAGE = "Share weight cannot exceed 20.0";

    public static final String VALIDATION_FEED_SAVE_WEIGHT_REQUIRED = "Save weight is required";
    public static final String VALIDATION_FEED_SAVE_WEIGHT_MIN_MESSAGE = "Save weight must be non-negative";
    public static final String VALIDATION_FEED_SAVE_WEIGHT_MAX_MESSAGE = "Save weight cannot exceed 20.0";

    public static final String VALIDATION_FEED_COMMENT_WEIGHT_REQUIRED = "Comment weight is required";
    public static final String VALIDATION_FEED_COMMENT_WEIGHT_MIN_MESSAGE = "Comment weight must be non-negative";
    public static final String VALIDATION_FEED_COMMENT_WEIGHT_MAX_MESSAGE = "Comment weight cannot exceed 20.0";

    public static final String VALIDATION_FEED_LIKE_WEIGHT_REQUIRED = "Like weight is required";
    public static final String VALIDATION_FEED_LIKE_WEIGHT_MIN_MESSAGE = "Like weight must be non-negative";
    public static final String VALIDATION_FEED_LIKE_WEIGHT_MAX_MESSAGE = "Like weight cannot exceed 20.0";

    public static final String VALIDATION_FEED_AUTHOR_AFFINITY_REQUIRED = "Author affinity weight is required";
    public static final String FEED_AFFINITY_WEIGHT_MIN = "0.0";
    public static final String FEED_AFFINITY_WEIGHT_MAX = "100.0";
    public static final String VALIDATION_FEED_AUTHOR_AFFINITY_MIN_MESSAGE = "Author affinity weight must be non-negative";
    public static final String VALIDATION_FEED_AUTHOR_AFFINITY_MAX_MESSAGE = "Author affinity weight cannot exceed 100.0";

    public static final String VALIDATION_FEED_TOPIC_AFFINITY_REQUIRED = "Topic affinity weight is required";
    public static final String VALIDATION_FEED_TOPIC_AFFINITY_MIN_MESSAGE = "Topic affinity weight must be non-negative";
    public static final String VALIDATION_FEED_TOPIC_AFFINITY_MAX_MESSAGE = "Topic affinity weight cannot exceed 100.0";

    public static final String VALIDATION_FEED_FOLLOWING_BONUS_REQUIRED = "Following bonus is required";
    public static final String FEED_FOLLOWING_BONUS_MIN = "0.0";
    public static final String FEED_FOLLOWING_BONUS_MAX = "50.0";
    public static final String VALIDATION_FEED_FOLLOWING_BONUS_MIN_MESSAGE = "Following bonus must be non-negative";
    public static final String VALIDATION_FEED_FOLLOWING_BONUS_MAX_MESSAGE = "Following bonus cannot exceed 50.0";

    public static final String VALIDATION_FEED_RECENCY_DECAY_REQUIRED = "Recency gravity decay is required";
    public static final String FEED_RECENCY_DECAY_MIN = "0.1";
    public static final String FEED_RECENCY_DECAY_MAX = "3.0";
    public static final String VALIDATION_FEED_RECENCY_DECAY_MIN_MESSAGE = "Recency gravity decay must be at least 0.1";
    public static final String VALIDATION_FEED_RECENCY_DECAY_MAX_MESSAGE = "Recency gravity decay cannot exceed 3.0";

    public static final String VALIDATION_FEED_ANTI_CLUSTERING_REQUIRED = "Anti-clustering window is required";
    public static final int FEED_ANTI_CLUSTERING_WINDOW_MIN = 1;
    public static final int FEED_ANTI_CLUSTERING_WINDOW_MAX = 10;
    public static final String VALIDATION_FEED_ANTI_CLUSTERING_MIN_MESSAGE = "Anti-clustering window must be at least 1";
    public static final String VALIDATION_FEED_ANTI_CLUSTERING_MAX_MESSAGE = "Anti-clustering window cannot exceed 10";

    public static final String VALIDATION_FEED_POSTS_PER_REEL_REQUIRED = "Posts per reel is required";
    public static final int FEED_POSTS_PER_REEL_MIN = 1;
    public static final int FEED_POSTS_PER_REEL_MAX = 10;
    public static final String VALIDATION_FEED_POSTS_PER_REEL_MIN_MESSAGE = "Posts per reel must be at least 1";
    public static final String VALIDATION_FEED_POSTS_PER_REEL_MAX_MESSAGE = "Posts per reel cannot exceed 10";

    public static final String VALIDATION_FEED_SEEN_PENALTY_REQUIRED = "Seen post penalty multiplier is required";
    public static final String FEED_SEEN_PENALTY_MIN = "0.0";
    public static final String FEED_SEEN_PENALTY_MAX = "1.0";
    public static final String VALIDATION_FEED_SEEN_PENALTY_MIN_MESSAGE = "Seen post penalty must be non-negative";
    public static final String VALIDATION_FEED_SEEN_PENALTY_MAX_MESSAGE = "Seen post penalty cannot exceed 1.0";

    public static final String VALIDATION_FEED_SUGGESTED_INTERVAL_REQUIRED = "Suggested creators interval is required";
    public static final int FEED_SUGGESTED_INTERVAL_MIN = 3;
    public static final int FEED_SUGGESTED_INTERVAL_MAX = 20;
    public static final String VALIDATION_FEED_SUGGESTED_INTERVAL_MIN_MESSAGE = "Suggested creators interval must be at least 3";
    public static final String VALIDATION_FEED_SUGGESTED_INTERVAL_MAX_MESSAGE = "Suggested creators interval cannot exceed 20";

    public static final String VALIDATION_FEED_ALL_CAUGHT_UP_REQUIRED = "All caught up hours threshold is required";
    public static final int FEED_ALL_CAUGHT_UP_HOURS_MIN = 12;
    public static final int FEED_ALL_CAUGHT_UP_HOURS_MAX = 336;
    public static final String VALIDATION_FEED_ALL_CAUGHT_UP_MIN_MESSAGE = "All caught up hours threshold must be at least 12";
    public static final String VALIDATION_FEED_ALL_CAUGHT_UP_MAX_MESSAGE = "All caught up hours threshold cannot exceed 336 (14 days)";
}
