package com.instagramclone.feed.controller;

import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.feed.constants.FeedConstants;
import com.instagramclone.feed.dto.request.FeedSeenRequest;
import com.instagramclone.feed.dto.response.FeedItemResponse;
import com.instagramclone.feed.service.interfaces.IFeedService;
import com.instagramclone.ratelimit.RateLimit;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for personalized, algorithmic timeline and explore feeds.
 */
@RestController
@RequestMapping(FeedConstants.BASE_PATH)
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class FeedController {

    private final IFeedService feedService;

    @RateLimit(category = "feed-read", limit = 60, windowSeconds = 60)
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<FeedItemResponse>>> getHomeFeed(
            @RequestParam(name = FeedConstants.PARAM_MODE, defaultValue = FeedConstants.DEFAULT_FEED_MODE) String mode,
            @PageableDefault(size = FeedConstants.DEFAULT_HOME_PAGE_SIZE, sort = FeedConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<FeedItemResponse> feed = feedService.getHomeFeed(mode, pageable);
        return ResponseEntity.ok(ApiResponse.success(FeedConstants.MSG_HOME_FEED_RETRIEVED, feed));
    }

    @GetMapping(FeedConstants.EXPLORE_PATH)
    public ResponseEntity<ApiResponse<PageResponse<FeedItemResponse>>> getExploreFeed(
            @PageableDefault(size = FeedConstants.DEFAULT_EXPLORE_PAGE_SIZE, sort = FeedConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<FeedItemResponse> explore = feedService.getExploreFeed(pageable);
        return ResponseEntity.ok(ApiResponse.success(FeedConstants.MSG_EXPLORE_FEED_RETRIEVED, explore));
    }

    @PostMapping(FeedConstants.SEEN_PATH)
    public ResponseEntity<ApiResponse<Void>> recordSeen(
            @Valid @RequestBody FeedSeenRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        feedService.recordSeen(currentUserId, request.getItemIds());
        return ResponseEntity.ok(ApiResponse.success(FeedConstants.MSG_FEED_SEEN_RECORDED, null));
    }

    @PostMapping(FeedConstants.NOT_INTERESTED_PATH)
    public ResponseEntity<ApiResponse<Void>> markNotInterested(
            @PathVariable(FeedConstants.PATH_ITEM_ID) UUID itemId,
            @RequestParam(name = FeedConstants.PARAM_ITEM_TYPE, defaultValue = FeedConstants.DEFAULT_ITEM_TYPE) String itemType) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        feedService.markNotInterested(currentUserId, itemId, itemType);
        return ResponseEntity.ok(ApiResponse.success(FeedConstants.MSG_FEED_NOT_INTERESTED, null));
    }
}
