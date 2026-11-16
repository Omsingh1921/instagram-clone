package com.instagramclone.story.service.interfaces;

import com.instagramclone.chat.dto.response.MessageResponse;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.story.dto.request.AddHighlightItemsRequest;
import com.instagramclone.story.dto.request.CreateHighlightRequest;
import com.instagramclone.story.dto.request.CreateQuestionAnswerRequest;
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
import com.instagramclone.story.dto.response.StoryQuestionAnswerResponse;
import com.instagramclone.story.dto.response.StoryQuizResponse;
import com.instagramclone.story.dto.response.StoryResponse;
import com.instagramclone.story.dto.response.StorySliderResponse;
import com.instagramclone.story.dto.response.StoryViewerResponse;
import com.instagramclone.story.dto.response.UserStoriesResponse;
import com.instagramclone.user.dto.response.UserSummaryResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface IStoryService {

    StoryResponse createStory(CreateStoryRequest request);

    List<UserStoriesResponse> getStoryFeed();

    UserStoriesResponse getUserStories(UUID userId);

    void markStoryViewed(UUID storyId);

    void deleteStory(UUID storyId);

    int cleanupExpiredStories();

    List<StoryViewerResponse> getStoryViewers(UUID storyId);

    StoryLikeResponse toggleLikeStory(UUID storyId);

    // ==================== STORY HIGHLIGHTS ====================

    HighlightSummaryResponse createHighlight(CreateHighlightRequest request);

    HighlightDetailResponse getHighlightById(UUID highlightId);

    List<HighlightSummaryResponse> getUserHighlights(UUID userId);

    HighlightSummaryResponse updateHighlight(UUID highlightId, UpdateHighlightRequest request);

    void deleteHighlight(UUID highlightId);

    HighlightDetailResponse addStoriesToHighlight(UUID highlightId, AddHighlightItemsRequest request);

    void removeStoryFromHighlight(UUID highlightId, UUID storyId);

    // ==================== ENGAGEMENT & REPLIES ====================

    MessageResponse replyToStory(UUID storyId, StoryReplyRequest request);

    MessageResponse reactToStory(UUID storyId, StoryReactionRequest request);

    StoryPollResponse voteOnPoll(UUID storyId, StoryPollVoteRequest request);

    void submitQuestionResponse(UUID storyId, CreateQuestionAnswerRequest request);

    List<StoryQuestionAnswerResponse> getQuestionResponses(UUID storyId);

    StoryQuizResponse voteOnQuiz(UUID storyId, StoryQuizVoteRequest request);

    StorySliderResponse voteOnSlider(UUID storyId, StorySliderVoteRequest request);

    StoryCountdownResponse toggleCountdownReminder(UUID storyId);

    // ==================== STORY ARCHIVE & MEMORIES ====================

    PageResponse<StoryArchiveItemResponse> getStoryArchive(Pageable pageable);

    Map<String, List<StoryArchiveItemResponse>> getStoryArchiveCalendar();

    StoryResponse reshareArchivedStory(UUID storyId);

    // ==================== PRIVACY & VISIBILITY ====================

    void hideStoryFromUser(UUID userId);

    void unhideStoryFromUser(UUID userId);

    List<UserSummaryResponse> getHiddenStoryUsers();

    // ==================== RESHARING ====================

    StoryResponse sharePostToStory(UUID postId);

    StoryResponse shareReelToStory(UUID reelId);

    StoryResponse shareMentionedStory(UUID storyId);

    // ==================== REPORTING & INSIGHTS ====================

    void reportStory(UUID storyId, StoryReportRequest request);

    StoryInsightResponse getStoryInsights(UUID storyId);
}
