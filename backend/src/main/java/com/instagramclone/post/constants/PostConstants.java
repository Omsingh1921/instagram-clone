package com.instagramclone.post.constants;

/**
 * Domain constants for the Post module.
 */
public final class PostConstants {

    private PostConstants() {
        // Prevent instantiation
    }

    public static final int MAX_CAPTION_LENGTH = 2200;
    public static final int MIN_MEDIA_COUNT = 1;
    public static final int MAX_MEDIA_COUNT = 10;
    public static final int MAX_HASHTAGS_PER_POST = 30;
    public static final int MAX_USER_TAGS_PER_POST = 20;

    public static final int DEFAULT_PAGE_SIZE = 12;
    public static final int MAX_PAGE_SIZE = 50;

    public static final int MAX_LOCATION_NAME_LENGTH = 150;
    public static final String CACHE_POST_PREFIX = "post:";

    // ==================== ENDPOINT PATHS ====================
    public static final String BASE_PATH = "/api/v1";
    public static final String POSTS_PATH = "/posts";
    public static final String SAVED_POSTS_PATH = "/posts/saved";
    public static final String POST_BY_ID_PATH = "/posts/{postId}";
    public static final String USER_POSTS_PATH = "/users/{userId}/posts";
    public static final String USER_TAGGED_POSTS_PATH = "/users/{userId}/posts/tagged";
    public static final String POST_PIN_PATH = "/posts/{postId}/pin";
    public static final String POST_COMMENTS_TOGGLE_PATH = "/posts/{postId}/toggle-comments";

    // ==================== RATE LIMIT CATEGORIES ====================
    public static final String RATE_LIMIT_CONTENT_CREATE = "content-create";

    // ==================== SORT PROPERTIES ====================
    public static final String SORT_BY_CREATED_AT = "createdAt";

    // ==================== CONTROLLER SUCCESS MESSAGES ====================
    public static final String MSG_POST_CREATED = "Post created successfully";
    public static final String MSG_SAVED_POSTS_RETRIEVED = "Saved posts retrieved successfully";
    public static final String MSG_POST_RETRIEVED = "Post retrieved successfully";
    public static final String MSG_USER_POSTS_RETRIEVED = "User posts retrieved successfully";
    public static final String MSG_USER_TAGGED_POSTS_RETRIEVED = "User tagged posts retrieved successfully";
    public static final String MSG_POST_UPDATED = "Post updated successfully";
    public static final String MSG_POST_DELETED = "Post deleted successfully";

    // ==================== SERVICE & BUSINESS ERROR MESSAGES ====================
    public static final String ERR_POST_NOT_FOUND = "Post not found with ID: ";
    public static final String ERR_AUTHOR_NOT_FOUND = "Author not found with ID: ";
    public static final String ERR_MEDIA_REQUIRED = "At least one media item is required to create a post";
    public static final String ERR_USER_NOT_FOUND = "User not found with ID: ";
    public static final String ERR_UNAUTHORIZED_UPDATE = "You are not authorized to update this post";
    public static final String ERR_UNAUTHORIZED_DELETE = "You are not authorized to delete this post";
    public static final String MSG_INVALID_CAPTION = "Caption cannot exceed 2200 characters";

    // ==================== DTO VALIDATION CONSTANTS & BOUNDS ====================

    // Location
    public static final int MAX_LOCATION_LENGTH = 255;
    public static final String VALIDATION_LOCATION_MAX_LENGTH_MESSAGE = "Location cannot exceed 255 characters";

    // Post Visibility
    public static final String VALIDATION_VISIBILITY_REQUIRED = "Post visibility is required";

    // Post Media List
    public static final String VALIDATION_MEDIA_REQUIRED = "At least one media item is required";
    public static final String VALIDATION_MEDIA_MAX_MESSAGE = "Post cannot contain more than 10 media items";

    // Post Media Attributes
    public static final int MAX_ALT_TEXT_LENGTH = 500;
    public static final String VALIDATION_ALT_TEXT_MAX_LENGTH_MESSAGE = "Alt text cannot exceed 500 characters";
    public static final String DEFAULT_FILTER_NAME = "NORMAL";

    // Post Media Tag (Coordinates & User)
    public static final String VALIDATION_TAGGED_USER_ID_REQUIRED = "Tagged user ID is required";
    public static final String COORD_PERCENT_MIN = "0.0";
    public static final String COORD_PERCENT_MAX = "100.0";
    public static final String VALIDATION_X_COORD_MIN_MESSAGE = "X coordinate percentage cannot be negative";
    public static final String VALIDATION_X_COORD_MAX_MESSAGE = "X coordinate percentage cannot exceed 100";
    public static final String VALIDATION_Y_COORD_MIN_MESSAGE = "Y coordinate percentage cannot be negative";
    public static final String VALIDATION_Y_COORD_MAX_MESSAGE = "Y coordinate percentage cannot exceed 100";

    // Post User Tag Defaults
    public static final double DEFAULT_TAG_COORD = 0.5;
}

