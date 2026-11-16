package com.instagramclone.story.controller;

import com.instagramclone.chat.dto.response.MessageResponse;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.ratelimit.RateLimit;
import com.instagramclone.story.constants.StoryConstants;
import com.instagramclone.story.dto.request.AddHighlightItemsRequest;
import com.instagramclone.story.dto.request.CreateHighlightRequest;
import com.instagramclone.story.dto.request.CreateStoryRequest;
import com.instagramclone.story.dto.request.StoryPollVoteRequest;
import com.instagramclone.story.dto.request.StoryQuizVoteRequest;
import com.instagramclone.story.dto.request.StoryReactionRequest;
import com.instagramclone.story.dto.request.StoryReplyRequest;
import com.instagramclone.story.dto.request.StoryReportRequest;
import com.instagramclone.story.dto.request.StorySliderVoteRequest;
import com.instagramclone.story.dto.request.UpdateHighlightRequest;
import com.instagramclone.story.dto.response.HighlightDetailResponse;
import com.instagramclone.story.dto.response.HighlightSummaryResponse;
import com.instagramclone.story.dto.response.StoryArchiveItemResponse;
import com.instagramclone.story.dto.response.StoryCountdownResponse;
import com.instagramclone.story.dto.response.StoryInsightResponse;
import com.instagramclone.story.dto.response.StoryLikeResponse;
import com.instagramclone.story.dto.response.StoryPollResponse;
import com.instagramclone.story.dto.response.StoryQuizResponse;
import com.instagramclone.story.dto.response.StoryResponse;
import com.instagramclone.story.dto.response.StorySliderResponse;
import com.instagramclone.story.dto.response.StoryViewerResponse;
import com.instagramclone.story.dto.response.UserStoriesResponse;
import com.instagramclone.story.service.interfaces.IStoryService;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.user.dto.response.UserSummaryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(StoryConstants.BASE_PATH)
@RequiredArgsConstructor
public class StoryController {

    private final IStoryService storyService;

    // ==================== STORY CREATION & FEEDS ====================
    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = StoryConstants.RATE_LIMIT_CONTENT_CREATE, limit = 15, windowSeconds = 60)
    @PostMapping(StoryConstants.STORIES_PATH)
    public ResponseEntity<ApiResponse<StoryResponse>> createStory(@Valid @RequestBody CreateStoryRequest request) {
        StoryResponse response = storyService.createStory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(StoryConstants.MSG_STORY_CREATED, response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping(StoryConstants.STORY_FEED_PATH)
    public ResponseEntity<ApiResponse<List<UserStoriesResponse>>> getStoryFeed() {
        List<UserStoriesResponse> feed = storyService.getStoryFeed();
        return ResponseEntity.ok(ApiResponse.success(StoryConstants.MSG_STORY_FEED_RETRIEVED, feed));
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping(StoryConstants.USER_STORIES_PATH)
    public ResponseEntity<ApiResponse<UserStoriesResponse>> getUserStories(@PathVariable UUID userId) {
        UserStoriesResponse response = storyService.getUserStories(userId);
        return ResponseEntity.ok(ApiResponse.success(StoryConstants.MSG_USER_STORIES_RETRIEVED, response));
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping(StoryConstants.STORY_VIEWERS_PATH)
    public ResponseEntity<ApiResponse<List<StoryViewerResponse>>> getStoryViewers(@PathVariable UUID storyId) {
        List<StoryViewerResponse> viewers = storyService.getStoryViewers(storyId);
        return ResponseEntity.ok(ApiResponse.success(StoryConstants.MSG_STORY_VIEWERS_RETRIEVED, viewers));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping(StoryConstants.STORY_VIEW_PATH)
    public ResponseEntity<ApiResponse<Void>> markStoryViewed(@PathVariable UUID storyId) {
        storyService.markStoryViewed(storyId);
        return ResponseEntity.ok(ApiResponse.success(StoryConstants.MSG_STORY_MARKED_VIEWED, null));
    }

    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = StoryConstants.RATE_LIMIT_CONTENT_ENGAGEMENT, limit = 60, windowSeconds = 60)
    @PostMapping(StoryConstants.STORY_LIKE_PATH)
    public ResponseEntity<ApiResponse<StoryLikeResponse>> toggleLikeStory(@PathVariable UUID storyId) {
        StoryLikeResponse response = storyService.toggleLikeStory(storyId);
        String message = response.isLiked() ? StoryConstants.MSG_STORY_LIKED : StoryConstants.MSG_STORY_UNLIKED;
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @DeleteMapping(StoryConstants.STORY_BY_ID_PATH)
    public ResponseEntity<ApiResponse<Void>> deleteStory(@PathVariable UUID storyId) {
        storyService.deleteStory(storyId);
        return ResponseEntity.ok(ApiResponse.success(StoryConstants.MSG_STORY_DELETED, null));
    }

    // ==================== ENGAGEMENT & REACTIONS ====================
    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = StoryConstants.RATE_LIMIT_CONTENT_ENGAGEMENT, limit = 30, windowSeconds = 60)
    @PostMapping(StoryConstants.STORY_REPLY_PATH)
    public ResponseEntity<ApiResponse<MessageResponse>> replyToStory(
            @PathVariable UUID storyId,
            @Valid @RequestBody StoryReplyRequest request) {
        MessageResponse response = storyService.replyToStory(storyId, request);
        return ResponseEntity.ok(ApiResponse.success(StoryConstants.MSG_STORY_REPLIED, response));
    }

    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = StoryConstants.RATE_LIMIT_CONTENT_ENGAGEMENT, limit = 60, windowSeconds = 60)
    @PostMapping("/stories/{storyId}/react")
    public ResponseEntity<ApiResponse<MessageResponse>> reactToStory(
            @PathVariable UUID storyId,
            @Valid @RequestBody StoryReactionRequest request) {
        MessageResponse response = storyService.reactToStory(storyId, request);
        return ResponseEntity.ok(ApiResponse.success("Reaction recorded successfully", response));
    }

    // ==================== INTERACTIVE STICKERS ====================
    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = StoryConstants.RATE_LIMIT_CONTENT_ENGAGEMENT, limit = 60, windowSeconds = 60)
    @PostMapping(StoryConstants.STORY_POLL_VOTE_PATH)
    public ResponseEntity<ApiResponse<StoryPollResponse>> voteOnPoll(
            @PathVariable UUID storyId,
            @Valid @RequestBody StoryPollVoteRequest request) {
        StoryPollResponse response = storyService.voteOnPoll(storyId, request);
        return ResponseEntity.ok(ApiResponse.success(StoryConstants.MSG_POLL_VOTED, response));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{storyId}/question-responses")
    public ResponseEntity<ApiResponse<Void>> submitQuestionResponse(
            @PathVariable UUID storyId,
            @Valid @RequestBody com.instagramclone.story.dto.request.CreateQuestionAnswerRequest request) {
        storyService.submitQuestionResponse(storyId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Response submitted successfully", null));
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping("/{storyId}/question-responses")
    public ResponseEntity<ApiResponse<List<com.instagramclone.story.dto.response.StoryQuestionAnswerResponse>>> getQuestionResponses(
            @PathVariable UUID storyId) {
        List<com.instagramclone.story.dto.response.StoryQuestionAnswerResponse> responses = storyService
                .getQuestionResponses(storyId);
        return ResponseEntity.ok(ApiResponse.success("Question responses retrieved successfully", responses));
    }

    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = StoryConstants.RATE_LIMIT_CONTENT_ENGAGEMENT, limit = 60, windowSeconds = 60)
    @PostMapping("/stories/{storyId}/quiz/vote")
    public ResponseEntity<ApiResponse<StoryQuizResponse>> voteOnQuiz(
            @PathVariable UUID storyId,
            @Valid @RequestBody StoryQuizVoteRequest request) {
        StoryQuizResponse response = storyService.voteOnQuiz(storyId, request);
        return ResponseEntity.ok(ApiResponse.success("Quiz vote recorded successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = StoryConstants.RATE_LIMIT_CONTENT_ENGAGEMENT, limit = 60, windowSeconds = 60)
    @PostMapping("/stories/{storyId}/slider/vote")
    public ResponseEntity<ApiResponse<StorySliderResponse>> voteOnSlider(
            @PathVariable UUID storyId,
            @Valid @RequestBody StorySliderVoteRequest request) {
        StorySliderResponse response = storyService.voteOnSlider(storyId, request);
        return ResponseEntity.ok(ApiResponse.success("Slider vote recorded successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/stories/{storyId}/countdown/remind")
    public ResponseEntity<ApiResponse<StoryCountdownResponse>> toggleCountdownReminder(@PathVariable UUID storyId) {
        StoryCountdownResponse response = storyService.toggleCountdownReminder(storyId);
        return ResponseEntity.ok(ApiResponse.success("Countdown reminder updated", response));
    }

    // ==================== STORY ARCHIVE & MEMORIES ====================

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/stories/archive")
    public ResponseEntity<ApiResponse<PageResponse<StoryArchiveItemResponse>>> getStoryArchive(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<StoryArchiveItemResponse> response = storyService.getStoryArchive(pageable);
        return ResponseEntity.ok(ApiResponse.success("Story archive retrieved successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/stories/archive/calendar")
    public ResponseEntity<ApiResponse<Map<String, List<StoryArchiveItemResponse>>>> getStoryArchiveCalendar() {
        Map<String, List<StoryArchiveItemResponse>> calendar = storyService.getStoryArchiveCalendar();
        return ResponseEntity.ok(ApiResponse.success("Story archive calendar retrieved successfully", calendar));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/stories/archive/{storyId}/reshare")
    public ResponseEntity<ApiResponse<StoryResponse>> reshareArchivedStory(@PathVariable UUID storyId) {
        StoryResponse response = storyService.reshareArchivedStory(storyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Archived memory reshared to story", response));
    }

    // ==================== PRIVACY & VISIBILITY ====================

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/users/story-privacy/hide/{userId}")
    public ResponseEntity<ApiResponse<Void>> hideStoryFromUser(@PathVariable UUID userId) {
        storyService.hideStoryFromUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Story hidden from user successfully", null));
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/users/story-privacy/unhide/{userId}")
    public ResponseEntity<ApiResponse<Void>> unhideStoryFromUser(@PathVariable UUID userId) {
        storyService.unhideStoryFromUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Story unhidden from user successfully", null));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/users/story-privacy/hidden")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getHiddenStoryUsers() {
        List<UserSummaryResponse> list = storyService.getHiddenStoryUsers();
        return ResponseEntity.ok(ApiResponse.success("Hidden story users retrieved successfully", list));
    }

    // ==================== RESHARING ====================

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/stories/share/post/{postId}")
    public ResponseEntity<ApiResponse<StoryResponse>> sharePostToStory(@PathVariable UUID postId) {
        StoryResponse response = storyService.sharePostToStory(postId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Post shared to story successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/stories/share/reel/{reelId}")
    public ResponseEntity<ApiResponse<StoryResponse>> shareReelToStory(@PathVariable UUID reelId) {
        StoryResponse response = storyService.shareReelToStory(reelId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reel shared to story successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/stories/share/mention/{storyId}")
    public ResponseEntity<ApiResponse<StoryResponse>> shareMentionedStory(@PathVariable UUID storyId) {
        StoryResponse response = storyService.shareMentionedStory(storyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Story reshared successfully", response));
    }

    // ==================== STORY HIGHLIGHTS ====================

    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = StoryConstants.RATE_LIMIT_CONTENT_CREATE, limit = 15, windowSeconds = 60)
    @PostMapping({ StoryConstants.HIGHLIGHTS_PATH, "/stories/highlights" })
    public ResponseEntity<ApiResponse<HighlightSummaryResponse>> createHighlight(
            @Valid @RequestBody CreateHighlightRequest request) {
        HighlightSummaryResponse response = storyService.createHighlight(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(StoryConstants.MSG_HIGHLIGHT_CREATED, response));
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping({ StoryConstants.HIGHLIGHT_BY_ID_PATH, "/stories/highlights/{highlightId}" })
    public ResponseEntity<ApiResponse<HighlightDetailResponse>> getHighlightById(@PathVariable UUID highlightId) {
        HighlightDetailResponse response = storyService.getHighlightById(highlightId);
        return ResponseEntity.ok(ApiResponse.success(StoryConstants.MSG_HIGHLIGHT_RETRIEVED, response));
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping({ StoryConstants.USER_HIGHLIGHTS_PATH, "/stories/highlights/user/{userId}" })
    public ResponseEntity<ApiResponse<List<HighlightSummaryResponse>>> getUserHighlights(@PathVariable UUID userId) {
        List<HighlightSummaryResponse> response = storyService.getUserHighlights(userId);
        return ResponseEntity.ok(ApiResponse.success(StoryConstants.MSG_HIGHLIGHTS_RETRIEVED, response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping({ StoryConstants.HIGHLIGHTS_PATH, "/stories/highlights" })
    public ResponseEntity<ApiResponse<List<HighlightSummaryResponse>>> getCurrentUserHighlights() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        List<HighlightSummaryResponse> response = storyService.getUserHighlights(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(StoryConstants.MSG_HIGHLIGHTS_RETRIEVED, response));
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping({ StoryConstants.HIGHLIGHT_BY_ID_PATH, "/stories/highlights/{highlightId}" })
    public ResponseEntity<ApiResponse<HighlightSummaryResponse>> updateHighlight(
            @PathVariable UUID highlightId,
            @Valid @RequestBody UpdateHighlightRequest request) {
        HighlightSummaryResponse response = storyService.updateHighlight(highlightId, request);
        return ResponseEntity.ok(ApiResponse.success(StoryConstants.MSG_HIGHLIGHT_UPDATED, response));
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @DeleteMapping({ StoryConstants.HIGHLIGHT_BY_ID_PATH, "/stories/highlights/{highlightId}" })
    public ResponseEntity<ApiResponse<Void>> deleteHighlight(@PathVariable UUID highlightId) {
        storyService.deleteHighlight(highlightId);
        return ResponseEntity.ok(ApiResponse.success(StoryConstants.MSG_HIGHLIGHT_DELETED, null));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping({ "/highlights/{highlightId}/items", "/stories/highlights/{highlightId}/items" })
    public ResponseEntity<ApiResponse<HighlightDetailResponse>> addStoriesToHighlight(
            @PathVariable UUID highlightId,
            @Valid @RequestBody AddHighlightItemsRequest request) {
        HighlightDetailResponse response = storyService.addStoriesToHighlight(highlightId, request);
        return ResponseEntity.ok(ApiResponse.success("Stories added to highlight successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping({ "/highlights/{highlightId}/items/{storyId}", "/stories/highlights/{highlightId}/items/{storyId}" })
    public ResponseEntity<ApiResponse<Void>> removeStoryFromHighlight(
            @PathVariable UUID highlightId,
            @PathVariable UUID storyId) {
        storyService.removeStoryFromHighlight(highlightId, storyId);
        return ResponseEntity.ok(ApiResponse.success("Story removed from highlight successfully", null));
    }

    // ==================== REPORTING & INSIGHTS ====================

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/stories/{storyId}/report")
    public ResponseEntity<ApiResponse<Void>> reportStory(
            @PathVariable UUID storyId,
            @Valid @RequestBody StoryReportRequest request) {
        storyService.reportStory(storyId, request);
        return ResponseEntity.ok(ApiResponse.success("Story reported successfully", null));
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping("/stories/{storyId}/insights")
    public ResponseEntity<ApiResponse<StoryInsightResponse>> getStoryInsights(@PathVariable UUID storyId) {
        StoryInsightResponse response = storyService.getStoryInsights(storyId);
        return ResponseEntity.ok(ApiResponse.success("Story insights retrieved successfully", response));
    }
}
