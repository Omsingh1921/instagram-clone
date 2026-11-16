package com.instagramclone.engagement.constants;

/**
 * Domain constants for user engagement: comments, likes, and bookmarks.
 */
public final class EngagementConstants {

    private EngagementConstants() {
        // Prevent instantiation
    }

    public static final int MAX_COMMENT_LENGTH = 1000;
    public static final int MAX_NESTED_COMMENT_DEPTH = 3;
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;

    public static final String CACHE_POST_LIKES_PREFIX = "post:likes:";
    public static final String CACHE_COMMENT_LIKES_PREFIX = "comment:likes:";

    // ==================== ENDPOINT PATHS ====================
    public static final String BASE_PATH = "/api/v1";
    public static final String POST_LIKE_PATH = "/posts/{postId}/like";
    public static final String POST_LIKES_PATH = "/posts/{postId}/likes";
    public static final String POST_SAVE_PATH = "/posts/{postId}/save";
    public static final String POST_COMMENTS_PATH = "/posts/{postId}/comments";
    public static final String POST_SHARE_PATH = "/posts/{postId}/share";
    public static final String POST_SHARES_PATH = "/posts/{postId}/shares";
    public static final String COMMENT_REPLIES_PATH = "/comments/{commentId}/replies";
    public static final String COMMENT_BY_ID_PATH = "/comments/{commentId}";

    // ==================== RATE LIMIT CATEGORIES ====================
    public static final String RATE_LIMIT_CONTENT_ENGAGEMENT = "content-engagement";
    public static final String RATE_LIMIT_CONTENT_COMMENT = "content-comment";

    // ==================== SORT PROPERTIES ====================
    public static final String SORT_BY_CREATED_AT = "createdAt";

    // ==================== CONTROLLER SUCCESS MESSAGES ====================
    public static final String MSG_POST_LIKED = "Post liked successfully";
    public static final String MSG_POST_UNLIKED = "Post unliked successfully";
    public static final String MSG_POST_LIKES_RETRIEVED = "Post likes retrieved successfully";
    public static final String MSG_POST_SAVED = "Post saved successfully";
    public static final String MSG_POST_UNSAVED = "Post unsaved successfully";
    public static final String MSG_COMMENT_ADDED = "Comment added successfully";
    public static final String MSG_COMMENTS_RETRIEVED = "Comments retrieved successfully";
    public static final String MSG_COMMENT_REPLIES_RETRIEVED = "Comment replies retrieved successfully";
    public static final String MSG_COMMENT_DELETED = "Comment deleted successfully";

    // ==================== SERVICE & BUSINESS ERROR MESSAGES ====================
    public static final String ERR_POST_NOT_FOUND = "Post not found with ID: ";
    public static final String ERR_COMMENT_NOT_FOUND = "Comment not found with ID: ";
    public static final String ERR_PARENT_COMMENT_NOT_FOUND = "Parent comment not found with ID: ";
    public static final String ERR_UNAUTHORIZED_COMMENT_DELETE = "You are not authorized to delete this comment";
    public static final String ERR_CURRENT_USER_NOT_FOUND = "Current user not found";
    public static final String MSG_INVALID_COMMENT = "Comment cannot exceed 1000 characters";

    // ==================== SHARE TYPES ====================
    public static final String DEFAULT_SHARE_TYPE = "COPY_LINK";
    public static final String SHARE_TYPE_COPY_LINK = "COPY_LINK";
    public static final String SHARE_TYPE_DIRECT_MESSAGE = "DIRECT_MESSAGE";
    public static final String SHARE_TYPE_EXTERNAL = "EXTERNAL";

    // ==================== DTO VALIDATION CONSTANTS & BOUNDS ====================

    // Collections Validation
    public static final int COLLECTION_NAME_MAX_LENGTH = 100;
    public static final String VALIDATION_COLLECTION_NAME_REQUIRED = "Collection name is required";
    public static final String VALIDATION_COLLECTION_NAME_MAX_LENGTH_MESSAGE = "Collection name cannot exceed 100 characters";
    public static final String VALIDATION_COLLECTION_NAME_MUST_NOT_EXCEED_MESSAGE = "Collection name must not exceed 100 characters";
    public static final int MAX_COVER_MEDIA_URL_LENGTH = 500;

    // Comments Validation
    public static final String VALIDATION_PARENT_COMMENT_ID_INVALID_UUID = "Parent comment ID must be a valid UUID";
}
