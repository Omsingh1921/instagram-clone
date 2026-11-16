package com.instagramclone.feed.constants;

/**
 * Domain constants for user Home Feed and Explore algorithmic Feed.
 */
public final class FeedConstants {

    private FeedConstants() {
        // Prevent instantiation
    }

    public static final int DEFAULT_FEED_SIZE = 15;
    public static final int DEFAULT_HOME_PAGE_SIZE = 5;
    public static final int DEFAULT_EXPLORE_PAGE_SIZE = 20;
    public static final int MAX_FEED_SIZE = 50;
    public static final double EXPLORE_REEL_RATIO = 0.35; // 35% reels in explore feed
    public static final int FEED_CACHE_TTL_MINUTES = 10;

    public static final String CACHE_HOME_FEED_PREFIX = "feed:home:";
    public static final String CACHE_HOME_FEED_PAGE0_PREFIX = "feed:home:page0:";
    public static final String CACHE_EXPLORE_FEED_KEY = "feed:explore";

    // ==================== ENDPOINT PATHS ====================
    public static final String BASE_PATH = "/api/v1/feed";
    public static final String EXPLORE_PATH = "/explore";
    public static final String SEEN_PATH = "/seen";
    public static final String NOT_INTERESTED_PATH = "/items/{itemId}/not-interested";

    // ==================== REQUEST PARAMETERS & PATH VARIABLES ====================
    public static final String PARAM_MODE = "mode";
    public static final String PARAM_ITEM_TYPE = "itemType";
    public static final String PATH_ITEM_ID = "itemId";

    // ==================== FEED MODES & ITEM TYPES ====================
    public static final String MODE_ALGORITHMIC = "ALGORITHMIC";
    public static final String MODE_FOLLOWING = "FOLLOWING";
    public static final String MODE_FAVORITES = "FAVORITES";
    public static final String DEFAULT_FEED_MODE = MODE_ALGORITHMIC;

    public static final String ITEM_TYPE_POST = "POST";
    public static final String ITEM_TYPE_REEL = "REEL";
    public static final String DEFAULT_ITEM_TYPE = ITEM_TYPE_POST;

    // ==================== SORT PROPERTIES ====================
    public static final String SORT_BY_CREATED_AT = "createdAt";

    // ==================== ALGORITHMIC RANKING WEIGHTS ====================
    public static final double DEFAULT_WEIGHT_SHARE = 4.0;
    public static final double DEFAULT_WEIGHT_SAVE = 3.0;
    public static final double DEFAULT_WEIGHT_COMMENT = 2.5;
    public static final double DEFAULT_WEIGHT_LIKE = 1.0;
    public static final double DEFAULT_WEIGHT_AUTHOR_AFFINITY = 25.0;
    public static final double DEFAULT_WEIGHT_TOPIC_AFFINITY = 20.0;
    public static final double DEFAULT_WEIGHT_FOLLOWING_BONUS = 15.0;
    public static final double DEFAULT_RECENCY_GRAVITY = 0.8;
    public static final int DEFAULT_ANTI_CLUSTERING_WINDOW = 4;
    public static final double DEFAULT_HOME_REEL_RATIO = 0.25; // 25% reels in home feed
    public static final double DEFAULT_SEEN_PENALTY_MULTIPLIER = 0.25;
    public static final double REELS_EXPLORATION_JITTER_WEIGHT = 5.0;

    // ==================== RANKING HEURISTICS & THRESHOLDS ====================
    public static final double BOOST_PINNED_POST = 10.0;
    public static final double BOOST_SAVED_POST = 10.0;
    public static final double BOOST_REEL_VIEW = 0.1;
    public static final double LOG_SCALE_HOME = 5.0;
    public static final double LOG_SCALE_EXPLORE = 7.0;
    public static final double LOG_SCALE_REELS = 6.0;
    public static final double AUTHOR_AFFINITY_CAP_MULTIPLIER = 1.4;
    public static final double AUTHOR_AFFINITY_SCALE = 1.5;
    public static final double TOPIC_AFFINITY_CAP_MULTIPLIER = 1.5;
    public static final double TOPIC_AFFINITY_SCALE = 1.2;
    public static final double TIME_DECAY_BASE = 1.0;
    public static final double MIN_DECAY_FACTOR = 0.5;
    public static final double RANKING_SCORE_EPSILON = 1.0;
    public static final long THRESHOLD_POPULAR_LIKES = 20;
    public static final long THRESHOLD_POPULAR_SHARES = 5;
    public static final double THRESHOLD_HASHTAG_AFFINITY_HIGH = 3.0;
    public static final double THRESHOLD_HASHTAG_AFFINITY_MEDIUM = 2.0;

    // ==================== DIVERSITY FILTER THRESHOLDS ====================
    public static final int ALL_CAUGHT_UP_LOOKAHEAD_ITEMS = 5;
    public static final int ALL_CAUGHT_UP_SEEN_THRESHOLD = 3;
    public static final int ALL_CAUGHT_UP_INSERT_POSITION = 3;
    public static final int SUGGESTED_CREATORS_MIN_INTERVAL = 2;

    // ==================== RECOMMENDATION LABELS & REASONS ====================
    public static final String REASON_PREVIOUSLY_VIEWED = "Previously viewed";
    public static final String REASON_FOLLOWED_CREATOR = "Followed creator";
    public static final String REASON_SUGGESTED_FOR_YOU = "Suggested for you";
    public static final String REASON_POPULAR_NETWORK = "Popular in your network";
    public static final String REASON_POPULAR_EXPLORE = "Popular explore content";
    public static final String REASON_ALL_CAUGHT_UP = "All caught up";
    public static final String REASON_SUGGESTED_PREFIX = "Suggested because you like ";
    public static final String REASON_EXPLORE_PREFIX = "Because you explore ";
    public static final String MSG_ALL_CAUGHT_UP_NOTICE = "You're all caught up! You've seen all new posts from the past 3 days.";

    // ==================== CONTROLLER SUCCESS MESSAGES ====================
    public static final String MSG_HOME_FEED_RETRIEVED = "Home feed retrieved successfully";
    public static final String MSG_EXPLORE_FEED_RETRIEVED = "Explore feed retrieved successfully";
    public static final String MSG_FEED_CONFIG_RETRIEVED = "Feed configuration retrieved successfully";
    public static final String MSG_FEED_CONFIG_UPDATED = "Feed configuration updated successfully";
    public static final String MSG_FEED_SEEN_RECORDED = "Seen impressions recorded successfully";
    public static final String MSG_FEED_NOT_INTERESTED = "Item marked as not interested";

    // ==================== USER AFFINITY & TELEMETRY CONSTANTS ====================
    public static final String CACHE_AFFINITY_PREFIX = "feed:affinity:";
    public static final String CACHE_SEEN_PREFIX = "feed:seen:";
    public static final int AFFINITY_CACHE_TTL_HOURS = 24;
    public static final int SEEN_CACHE_TTL_HOURS = 12;
    public static final double MAX_CREATOR_AFFINITY = 50.0;
    public static final double MAX_HASHTAG_AFFINITY = 35.0;
    public static final int MAX_SEEN_CACHE_SIZE = 500;
    public static final int MAX_RECENT_INTERACTED_ITEMS = 100;
    public static final double MIN_NEGATIVE_AFFINITY_FLOOR = -20.0;
    public static final double PENALTY_NOT_INTERESTED = 15.0;
    public static final double MAX_REEL_PREFERENCE_RATIO = 0.9;
    public static final double MIN_REEL_PREFERENCE_RATIO = 0.1;
    public static final double REEL_PREFERENCE_INCREMENT = 0.02;
    public static final double REEL_PREFERENCE_DECREMENT = 0.01;

    // Affinity Creator Event Weights
    public static final double AFFINITY_CREATOR_WEIGHT_SHARE = 4.0;
    public static final double AFFINITY_CREATOR_WEIGHT_SAVE = 3.5;
    public static final double AFFINITY_CREATOR_WEIGHT_COMMENT = 2.5;
    public static final double AFFINITY_CREATOR_WEIGHT_LIKE = 1.0;
    public static final double AFFINITY_CREATOR_WEIGHT_VIEW = 0.5;

    // Affinity Hashtag Event Weights
    public static final double AFFINITY_HASHTAG_WEIGHT_SHARE = 3.0;
    public static final double AFFINITY_HASHTAG_WEIGHT_SAVE = 2.5;
    public static final double AFFINITY_HASHTAG_WEIGHT_COMMENT = 2.0;
    public static final double AFFINITY_HASHTAG_WEIGHT_LIKE = 1.0;
    public static final double AFFINITY_HASHTAG_WEIGHT_VIEW = 0.4;

    // Interaction Event Types
    public static final String EVENT_POST_SHARED = "POST_SHARED";
    public static final String EVENT_REEL_SHARED = "REEL_SHARED";
    public static final String EVENT_POST_SAVED = "POST_SAVED";
    public static final String EVENT_REEL_SAVED = "REEL_SAVED";
    public static final String EVENT_POST_COMMENTED = "POST_COMMENTED";
    public static final String EVENT_REEL_COMMENTED = "REEL_COMMENTED";
    public static final String EVENT_POST_LIKED = "POST_LIKED";
    public static final String EVENT_REEL_LIKED = "REEL_LIKED";
    public static final String EVENT_REEL_VIEWED = "REEL_VIEWED";
    public static final String EVENT_PREFIX_POST = "POST_";
    public static final String EVENT_PREFIX_REEL = "REEL_";

    // ==================== VALIDATION MESSAGES ====================
    public static final String VALIDATION_SEEN_ITEM_IDS_REQUIRED = "Item IDs cannot be empty";
}
