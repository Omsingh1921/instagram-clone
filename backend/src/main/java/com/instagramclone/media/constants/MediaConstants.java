package com.instagramclone.media.constants;

import java.util.Set;

/**
 * Domain constants for media storage limits, allowed MIME types, and dimensions.
 */
public final class MediaConstants {

    private MediaConstants() {
        // Prevent instantiation
    }

    public static final long MAX_IMAGE_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB
    public static final long MAX_VIDEO_SIZE_BYTES = 100L * 1024 * 1024; // 100 MB

    public static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    public static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
            "video/mp4",
            "video/webm",
            "video/quicktime"
    );

    public static final int MAX_FILENAME_LENGTH = 255;

    // ==================== ENDPOINT PATHS ====================
    public static final String BASE_PATH = "/api/v1/media";
    public static final String MEDIA_BY_ID_PATH = "/{mediaId}";
    public static final String ASSETS_PROXY_PATH = "/assets/**";

    // ==================== MEDIA URL MASKING & CDN CONSTANTS ====================
    public static final String DEFAULT_CDN_PREFIX = "/cdn";
    public static final String CLOUDINARY_URL_BASE = "https://res.cloudinary.com/";
    public static final String PATH_IMAGE_UPLOAD = "/image/upload";
    public static final String PATH_VIDEO_UPLOAD = "/video/upload";
    public static final String PATH_RAW_UPLOAD = "/raw/upload";
    public static final int CDN_PROXY_CONNECT_TIMEOUT_MS = 8000;
    public static final int CDN_PROXY_READ_TIMEOUT_MS = 30000;
    public static final long CDN_CACHE_DURATION_DAYS = 30L;
    public static final String HEADER_VALUE_BYTES = "bytes";
    public static final String HTTP_METHOD_GET = "GET";
    public static final String WILDCARD_PATH = "/**";

    // ==================== RATE LIMIT CATEGORIES ====================
    public static final String RATE_LIMIT_MEDIA_UPLOAD = "media-upload";
    public static final String RATE_LIMIT_CDN_PROXY = "cdn-proxy";

    // ==================== REQUEST PARAMETERS & DEFAULTS ====================
    public static final String PARAM_FILE = "file";
    public static final String PARAM_CATEGORY = "category";
    public static final String DEFAULT_CATEGORY = "posts";

    // ==================== SWAGGER & OPENAPI TAGS ====================
    public static final String TAG_MEDIA = "Media";
    public static final String TAG_MEDIA_DESCRIPTION = "Cloudinary Media Upload & Lifecycle Management";

    // ==================== CONTROLLER SUCCESS MESSAGES ====================
    public static final String MSG_MEDIA_UPLOADED = "Media uploaded successfully";
    public static final String MSG_MEDIA_DELETED = "Media deleted successfully";

    // ==================== SERVICE & BUSINESS ERROR MESSAGES ====================
    public static final String ERR_MEDIA_NOT_FOUND = "Media not found: ";
    public static final String ERR_FILE_EMPTY = "Uploaded file cannot be empty";
    public static final String ERR_PROCESS_FILE_BYTES = "Failed to process uploaded file bytes";
    public static final String ERR_UNAUTHORIZED_DELETE = "You are not authorized to delete this media asset";
    public static final String MSG_INVALID_MEDIA_URL = "Media URL is invalid or exceeds permissible length";

    // ==================== DTO VALIDATION CONSTANTS & BOUNDS ====================

    // Reel Bytes Validation
    public static final String VALIDATION_MAX_REEL_BYTES_REQUIRED = "maxReelBytes is required";
    public static final long REEL_BYTES_MIN = 1048576L;
    public static final long REEL_BYTES_MAX = 1073741824L;
    public static final String VALIDATION_MAX_REEL_BYTES_MIN_MESSAGE = "Max reel bytes must be at least 1MB";
    public static final String VALIDATION_MAX_REEL_BYTES_MAX_MESSAGE = "Max reel bytes cannot exceed 1GB";

    // Post Bytes Validation
    public static final String VALIDATION_MAX_POST_BYTES_REQUIRED = "maxPostBytes is required";
    public static final long POST_BYTES_MIN = 1048576L;
    public static final long POST_BYTES_MAX = 524288000L;
    public static final String VALIDATION_MAX_POST_BYTES_MIN_MESSAGE = "Max post bytes must be at least 1MB";
    public static final String VALIDATION_MAX_POST_BYTES_MAX_MESSAGE = "Max post bytes cannot exceed 500MB";

    // Reel Duration Validation
    public static final String VALIDATION_MAX_REEL_DURATION_REQUIRED = "maxReelDurationSec is required";
    public static final int REEL_DURATION_SEC_MIN = 5;
    public static final int REEL_DURATION_SEC_MAX = 900;
    public static final String VALIDATION_MAX_REEL_DURATION_MIN_MESSAGE = "Max reel duration must be at least 5 seconds";
    public static final String VALIDATION_MAX_REEL_DURATION_MAX_MESSAGE = "Max reel duration cannot exceed 15 minutes";

    // Story Duration Validation
    public static final String VALIDATION_MAX_STORY_DURATION_REQUIRED = "maxStoryDurationSec is required";
    public static final int STORY_DURATION_SEC_MIN = 5;
    public static final int STORY_DURATION_SEC_MAX = 180;
    public static final String VALIDATION_MAX_STORY_DURATION_MIN_MESSAGE = "Max story duration must be at least 5 seconds";
    public static final String VALIDATION_MAX_STORY_DURATION_MAX_MESSAGE = "Max story duration cannot exceed 3 minutes";

    // Allowed MIME Types Validation & Defaults
    public static final String VALIDATION_ALLOWED_MIME_TYPES_REQUIRED = "allowedMimeTypes is required";
    public static final String DEFAULT_ALLOWED_MIME_TYPES = "video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp";
}
