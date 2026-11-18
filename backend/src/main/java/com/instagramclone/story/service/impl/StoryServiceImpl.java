package com.instagramclone.story.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.admin.dto.request.CreateReportRequest;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.admin.repository.ReportRepository;
import com.instagramclone.admin.service.interfaces.IAdminService;
import com.instagramclone.admin.service.interfaces.IDynamicDeletionConfigService;
import com.instagramclone.admin.service.interfaces.IDynamicFeatureFlagService;
import com.instagramclone.admin.service.interfaces.IDynamicModerationConfigService;
import com.instagramclone.chat.dto.request.SendMessageRequest;
import com.instagramclone.chat.dto.response.ConversationResponse;
import com.instagramclone.chat.dto.response.MessageResponse;
import com.instagramclone.chat.enums.MessageType;
import com.instagramclone.chat.service.interfaces.IChatService;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ForbiddenException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.follow.service.interfaces.IFollowService;
import com.instagramclone.media.service.interfaces.IDynamicMediaConfigService;
import com.instagramclone.media.service.interfaces.IMediaService;
import com.instagramclone.media.service.interfaces.IMediaUrlService;
import com.instagramclone.notification.enums.NotificationType;
import com.instagramclone.notification.service.interfaces.INotificationService;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import com.instagramclone.post.entity.Post;
import com.instagramclone.post.enums.MediaType;
import com.instagramclone.post.repository.PostRepository;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.repository.ReelRepository;
import com.instagramclone.security.service.interfaces.IPrivacyService;
import com.instagramclone.story.constants.StoryConstants;
import com.instagramclone.story.dto.request.AddHighlightItemsRequest;
import com.instagramclone.story.dto.request.CreateHighlightRequest;
import com.instagramclone.story.dto.request.CreateQuestionAnswerRequest;
import com.instagramclone.story.dto.request.CreateStoryRequest;
import com.instagramclone.story.dto.request.StoryHashtagRequest;
import com.instagramclone.story.dto.request.StoryLinkRequest;
import com.instagramclone.story.dto.request.StoryLocationRequest;
import com.instagramclone.story.dto.request.StoryMentionRequest;
import com.instagramclone.story.dto.request.StoryPollVoteRequest;
import com.instagramclone.story.dto.request.StoryQuizVoteRequest;
import com.instagramclone.story.dto.request.StoryReactionRequest;
import com.instagramclone.story.dto.request.StoryReplyRequest;
import com.instagramclone.story.dto.request.StoryReportRequest;
import com.instagramclone.story.dto.request.StorySliderVoteRequest;
import com.instagramclone.story.dto.request.UpdateHighlightRequest;
import com.instagramclone.story.dto.response.HighlightDetailResponse;
import com.instagramclone.story.dto.response.HighlightSummaryResponse;
import com.instagramclone.story.dto.response.StoryAddYoursResponse;
import com.instagramclone.story.dto.response.StoryArchiveItemResponse;
import com.instagramclone.story.dto.response.StoryCountdownResponse;
import com.instagramclone.story.dto.response.StoryHashtagResponse;
import com.instagramclone.story.dto.response.StoryInsightResponse;
import com.instagramclone.story.dto.response.StoryLikeResponse;
import com.instagramclone.story.dto.response.StoryLinkResponse;
import com.instagramclone.story.dto.response.StoryLocationResponse;
import com.instagramclone.story.dto.response.StoryMentionResponse;
import com.instagramclone.story.dto.response.StoryPollResponse;
import com.instagramclone.story.dto.response.StoryQuestionAnswerResponse;
import com.instagramclone.story.dto.response.StoryQuestionResponseDto;
import com.instagramclone.story.dto.response.StoryQuizResponse;
import com.instagramclone.story.dto.response.StoryResponse;
import com.instagramclone.story.dto.response.StorySliderResponse;
import com.instagramclone.story.dto.response.StoryViewerResponse;
import com.instagramclone.story.dto.response.UserStoriesResponse;
import com.instagramclone.story.entity.Story;
import com.instagramclone.story.entity.StoryAddYours;
import com.instagramclone.story.entity.StoryCountdown;
import com.instagramclone.story.entity.StoryCountdownSubscriber;
import com.instagramclone.story.entity.StoryHashtag;
import com.instagramclone.story.entity.StoryHighlight;
import com.instagramclone.story.entity.StoryHighlightItem;
import com.instagramclone.story.entity.StoryInsight;
import com.instagramclone.story.entity.StoryLike;
import com.instagramclone.story.entity.StoryLink;
import com.instagramclone.story.entity.StoryLocation;
import com.instagramclone.story.entity.StoryMention;
import com.instagramclone.story.entity.StoryPoll;
import com.instagramclone.story.entity.StoryPollVote;
import com.instagramclone.story.entity.StoryQuestion;
import com.instagramclone.story.entity.StoryQuestionResponse;
import com.instagramclone.story.entity.StoryQuiz;
import com.instagramclone.story.entity.StoryQuizVote;
import com.instagramclone.story.entity.StoryReaction;
import com.instagramclone.story.entity.StorySlider;
import com.instagramclone.story.entity.StorySliderVote;
import com.instagramclone.story.entity.StoryView;
import com.instagramclone.story.entity.UserStoryHiddenUser;
import com.instagramclone.story.repository.StoryAddYoursEntryRepository;
import com.instagramclone.story.repository.StoryAddYoursRepository;
import com.instagramclone.story.repository.StoryCountdownRepository;
import com.instagramclone.story.repository.StoryCountdownSubscriberRepository;
import com.instagramclone.story.repository.StoryHashtagRepository;
import com.instagramclone.story.repository.StoryHighlightItemRepository;
import com.instagramclone.story.repository.StoryHighlightRepository;
import com.instagramclone.story.repository.StoryInsightRepository;
import com.instagramclone.story.repository.StoryLikeRepository;
import com.instagramclone.story.repository.StoryLinkRepository;
import com.instagramclone.story.repository.StoryLocationRepository;
import com.instagramclone.story.repository.StoryMentionRepository;
import com.instagramclone.story.repository.StoryPollRepository;
import com.instagramclone.story.repository.StoryPollVoteRepository;
import com.instagramclone.story.repository.StoryQuestionRepository;
import com.instagramclone.story.repository.StoryQuestionResponseRepository;
import com.instagramclone.story.repository.StoryQuizRepository;
import com.instagramclone.story.repository.StoryQuizVoteRepository;
import com.instagramclone.story.repository.StoryReactionRepository;
import com.instagramclone.story.repository.StoryRepository;
import com.instagramclone.story.repository.StorySliderRepository;
import com.instagramclone.story.repository.StorySliderVoteRepository;
import com.instagramclone.story.repository.StoryViewRepository;
import com.instagramclone.story.repository.UserStoryHiddenUserRepository;
import com.instagramclone.story.service.interfaces.IStoryService;
import com.instagramclone.user.constants.UserConstants;
import com.instagramclone.user.dto.response.UserSummaryResponse;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.entity.UserSettings;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.enums.StoryReplyPermission;
import com.instagramclone.user.repository.CloseFriendRepository;
import com.instagramclone.user.repository.ProfileRepository;
import com.instagramclone.user.repository.UserRepository;
import com.instagramclone.user.repository.UserSettingsRepository;
import com.instagramclone.utility.RedisDistributedLockService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoryServiceImpl implements IStoryService {

    private static final Logger log = LoggerFactory.getLogger(StoryServiceImpl.class);

    private final StoryRepository storyRepository;
    private final StoryViewRepository storyViewRepository;
    private final StoryMentionRepository storyMentionRepository;
    private final StoryLikeRepository storyLikeRepository;
    private final StoryHighlightRepository storyHighlightRepository;
    private final StoryHighlightItemRepository storyHighlightItemRepository;
    private final StoryPollRepository storyPollRepository;
    private final StoryPollVoteRepository storyPollVoteRepository;
    private final StoryQuestionRepository storyQuestionRepository;
    private final StoryQuestionResponseRepository storyQuestionResponseRepository;
    private final StoryQuizRepository storyQuizRepository;
    private final StoryQuizVoteRepository storyQuizVoteRepository;
    private final StorySliderRepository storySliderRepository;
    private final StorySliderVoteRepository storySliderVoteRepository;
    private final StoryCountdownRepository storyCountdownRepository;
    private final StoryCountdownSubscriberRepository storyCountdownSubscriberRepository;
    private final StoryLinkRepository storyLinkRepository;
    private final StoryLocationRepository storyLocationRepository;
    private final StoryHashtagRepository storyHashtagRepository;
    private final StoryAddYoursRepository storyAddYoursRepository;
    private final StoryAddYoursEntryRepository storyAddYoursEntryRepository;
    private final StoryReactionRepository storyReactionRepository;
    private final StoryInsightRepository storyInsightRepository;
    private final UserStoryHiddenUserRepository userStoryHiddenUserRepository;
    private final CloseFriendRepository closeFriendRepository;
    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final IFollowService followService;
    private final ProfileRepository profileRepository;
    private final IMediaService mediaService;
    private final IMediaUrlService mediaUrlService;
    private final IPrivacyService privacyService;
    private final INotificationService notificationService;
    private final IChatService chatService;
    private final IAdminService adminService;
    private final PostRepository postRepository;
    private final ReelRepository reelRepository;
    private final RedisDistributedLockService lockService;
    private final PlatformTransactionManager transactionManager;
    private final com.instagramclone.user.repository.UserMuteRepository userMuteRepository;
    private final ObjectMapper objectMapper;
    private final IDynamicFeatureFlagService dynamicFeatureFlagService;
    private final IDynamicMediaConfigService dynamicMediaConfigService;
    private final IDynamicDeletionConfigService dynamicDeletionConfigService;
    private final IDynamicModerationConfigService dynamicModerationConfigService;
    private final ReportRepository reportRepository;

    private boolean acquireLockWithRetry(String lockKey, String lockOwner, Duration lease, int maxRetries,
            long sleepMs) {
        for (int i = 0; i < maxRetries; i++) {
            if (lockService.tryLock(lockKey, lockOwner, lease)) {
                return true;
            }
            try {
                Thread.sleep(sleepMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return false;
    }

    // ==================== STORY CREATION & UPLOAD ====================

    @Override
    @Transactional
    public StoryResponse createStory(CreateStoryRequest request) {
        if (!Boolean.TRUE.equals(dynamicFeatureFlagService.getActiveConfig().getStoryCreationEnabled())) {
            throw new BadRequestException("Story creation is temporarily disabled by system administrator");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User author = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + currentUserId));

        if (author.getRole() == Role.ROLE_ADMIN || "admin".equalsIgnoreCase(author.getUsername())) {
            throw new BadRequestException("Admin accounts cannot create stories");
        }

        Story story = Story.builder()
                .user(author)
                .mediaUrl(mediaUrlService.unmaskUrl(request.getMediaUrl().trim()))
                .mediaType(request.getMediaType())
                .caption(request.getCaption() != null ? request.getCaption().trim() : null)
                .isCloseFriendsOnly(request.isCloseFriendsOnly())
                .audioTitle(request.getAudioTitle())
                .audioArtist(request.getAudioArtist())
                .audioUrl(request.getAudioUrl())
                .filterName(request.getFilterName())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        Story saved = storyRepository.save(story);
        log.info("Created story {} for user {} (closeFriendsOnly: {})", saved.getId(), author.getUsername(),
                saved.isCloseFriendsOnly());

        // 1. Interactive Poll Sticker
        if (request.getPoll() != null && request.getPoll().getQuestion() != null
                && !request.getPoll().getQuestion().isBlank()) {
            StoryPoll poll = StoryPoll.builder()
                    .story(saved)
                    .question(request.getPoll().getQuestion().trim())
                    .optionA(request.getPoll().getOptionA() != null && !request.getPoll().getOptionA().isBlank()
                            ? request.getPoll().getOptionA().trim()
                            : "Yes")
                    .optionB(request.getPoll().getOptionB() != null && !request.getPoll().getOptionB().isBlank()
                            ? request.getPoll().getOptionB().trim()
                            : "No")
                    .build();
            storyPollRepository.save(poll);
            saved.setPoll(poll);
        }

        // 2. Interactive Question Sticker
        if (request.getQuestionPrompt() != null && !request.getQuestionPrompt().isBlank()) {
            StoryQuestion question = StoryQuestion.builder()
                    .story(saved)
                    .prompt(request.getQuestionPrompt().trim())
                    .build();
            storyQuestionRepository.save(question);
            saved.setQuestion(question);
        }

        // 3. Interactive Quiz Sticker
        if (request.getQuiz() != null && request.getQuiz().getQuestion() != null
                && !request.getQuiz().getQuestion().isBlank()) {
            try {
                String optionsJson = objectMapper.writeValueAsString(request.getQuiz().getOptions());
                StoryQuiz quiz = StoryQuiz.builder()
                        .story(saved)
                        .question(request.getQuiz().getQuestion().trim())
                        .optionsJson(optionsJson)
                        .correctOptionIndex(request.getQuiz().getCorrectOptionIndex())
                        .build();
                storyQuizRepository.save(quiz);
                saved.setQuiz(quiz);
            } catch (Exception e) {
                log.warn("Failed to serialize quiz options: {}", e.getMessage());
            }
        }

        // 4. Interactive Emoji Slider Sticker
        if (request.getSlider() != null && request.getSlider().getQuestion() != null
                && !request.getSlider().getQuestion().isBlank()) {
            StorySlider slider = StorySlider.builder()
                    .story(saved)
                    .question(request.getSlider().getQuestion().trim())
                    .emoji(request.getSlider().getEmoji() != null ? request.getSlider().getEmoji() : "🔥")
                    .build();
            storySliderRepository.save(slider);
            saved.setSlider(slider);
        }

        // 5. Interactive Countdown Sticker
        if (request.getCountdown() != null && request.getCountdown().getTitle() != null
                && !request.getCountdown().getTitle().isBlank()) {
            StoryCountdown countdown = StoryCountdown.builder()
                    .story(saved)
                    .title(request.getCountdown().getTitle().trim())
                    .targetDate(request.getCountdown().getTargetDate())
                    .build();
            storyCountdownRepository.save(countdown);
            saved.setCountdown(countdown);
        }

        // 6. Interactive Add Yours Prompt Sticker
        if (request.getAddYours() != null && request.getAddYours().getPromptText() != null
                && !request.getAddYours().getPromptText().isBlank()) {
            StoryAddYours addYours = StoryAddYours.builder()
                    .story(saved)
                    .promptText(request.getAddYours().getPromptText().trim())
                    .build();
            storyAddYoursRepository.save(addYours);
            saved.setAddYours(addYours);
        }

        // 7. External Link Stickers
        if (request.getLinks() != null && !request.getLinks().isEmpty()) {
            for (StoryLinkRequest linkReq : request.getLinks()) {
                if (linkReq.getUrl() != null && !linkReq.getUrl().isBlank()) {
                    StoryLink link = StoryLink.builder()
                            .story(saved)
                            .url(linkReq.getUrl().trim())
                            .title(linkReq.getTitle() != null ? linkReq.getTitle().trim() : null)
                            .xPercent(linkReq.getXPercent())
                            .yPercent(linkReq.getYPercent())
                            .build();
                    storyLinkRepository.save(link);
                    saved.getLinks().add(link);
                }
            }
        }

        // 8. Location Stickers
        if (request.getLocations() != null && !request.getLocations().isEmpty()) {
            for (StoryLocationRequest locReq : request.getLocations()) {
                if (locReq.getLocationName() != null && !locReq.getLocationName().isBlank()) {
                    StoryLocation loc = StoryLocation.builder()
                            .story(saved)
                            .locationName(locReq.getLocationName().trim())
                            .latitude(locReq.getLatitude())
                            .longitude(locReq.getLongitude())
                            .xPercent(locReq.getXPercent())
                            .yPercent(locReq.getYPercent())
                            .build();
                    storyLocationRepository.save(loc);
                    saved.getLocations().add(loc);
                }
            }
        }

        // 9. Hashtag Stickers
        if (request.getHashtags() != null && !request.getHashtags().isEmpty()) {
            for (StoryHashtagRequest tagReq : request.getHashtags()) {
                if (tagReq.getHashtag() != null && !tagReq.getHashtag().isBlank()) {
                    StoryHashtag tag = StoryHashtag.builder()
                            .story(saved)
                            .hashtag(tagReq.getHashtag().trim().replaceAll("^#", ""))
                            .xPercent(tagReq.getXPercent())
                            .yPercent(tagReq.getYPercent())
                            .build();
                    storyHashtagRepository.save(tag);
                    saved.getHashtags().add(tag);
                }
            }
        }

        // 10. Mentions
        if (request.getMentions() != null && !request.getMentions().isEmpty()) {
            for (StoryMentionRequest mentionReq : request.getMentions()) {
                if (mentionReq.getUserId() == null || mentionReq.getUserId().equals(currentUserId)) {
                    continue;
                }
                userRepository.findById(mentionReq.getUserId()).ifPresent(mentionedUser -> {
                    if (mentionedUser.isDeletedOrDeactivated()
                            || privacyService.isBlockedBidirectional(currentUserId, mentionedUser.getId())) {
                        return;
                    }
                    StoryMention mention = StoryMention.builder()
                            .story(saved)
                            .mentionedUser(mentionedUser)
                            .xPercent(mentionReq.getXPercent())
                            .yPercent(mentionReq.getYPercent())
                            .build();
                    storyMentionRepository.save(mention);
                    saved.getMentions().add(mention);

                    notificationService.createNotification(
                            mentionedUser.getId(),
                            currentUserId,
                            NotificationType.USER_MENTIONED,
                            null,
                            null,
                            null,
                            saved.getMediaUrl());

                    // Instagram Parity: Send an automated story mention DM with preview & "Add to Story" button
                    try {
                        ConversationResponse conversation = chatService.getOrCreateDirectConversation(mentionedUser.getId());
                        SendMessageRequest sendRequest = SendMessageRequest.builder()
                                .content("Mentioned you in their story")
                                .messageType(MessageType.STORY_SHARE)
                                .mediaUrl(saved.getMediaUrl() + "#storyId=" + saved.getId() + "&mediaType=" + saved.getMediaType())
                                .build();
                        chatService.sendMessage(conversation.getId(), sendRequest);
                    } catch (Exception e) {
                        log.warn("Failed to send story mention direct message to user {}: {}", mentionedUser.getId(), e.getMessage());
                    }
                });
            }
        }

        // 11. Initial Story Insights Record
        StoryInsight insight = StoryInsight.builder()
                .story(saved)
                .impressions(0L)
                .reach(0L)
                .forwards(0L)
                .backwards(0L)
                .exits(0L)
                .replies(0L)
                .profileVisits(0L)
                .build();
        storyInsightRepository.save(insight);
        saved.setInsight(insight);

        return toStoryResponse(saved, currentUserId);
    }

    // ==================== STORY FEED & VIEWING ====================

    @Override
    @Transactional(readOnly = true)
    public List<UserStoriesResponse> getStoryFeed() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        List<UUID> followingIds = new ArrayList<>(followService.getFollowingIds(currentUserId));
        followingIds.removeIf(fId -> privacyService.isBlockedBidirectional(currentUserId, fId));

        // Filter muted story users
        List<UUID> mutedStoryUserIds = userMuteRepository.findMutedUserIdsForStories(currentUserId);
        if (mutedStoryUserIds != null && !mutedStoryUserIds.isEmpty()) {
            followingIds.removeAll(mutedStoryUserIds);
        }

        // Filter users who hid stories from current user
        List<UUID> usersWhoHid = userStoryHiddenUserRepository.findUserIdsWhoHidFromUser(currentUserId);
        if (usersWhoHid != null && !usersWhoHid.isEmpty()) {
            followingIds.removeAll(usersWhoHid);
        }

        // Filter reported users & reported stories
        List<UUID> reportedUserIds = reportRepository.findReportedUserIdsByReporterId(currentUserId);
        if (reportedUserIds != null && !reportedUserIds.isEmpty()) {
            followingIds.removeAll(reportedUserIds);
        }
        List<UUID> reportedStoryIds = reportRepository.findReportedStoryIdsByReporterId(currentUserId);
        Set<UUID> reportedStorySet = (reportedStoryIds != null) ? new HashSet<>(reportedStoryIds)
                : Collections.emptySet();

        if (!followingIds.contains(currentUserId)) {
            followingIds.add(currentUserId);
        }

        LocalDateTime now = LocalDateTime.now();
        List<Story> activeStories = storyRepository.findActiveStoriesByUserIds(followingIds, now);

        // Group by user & filter close friends stories
        Map<UUID, List<Story>> userStoriesMap = new LinkedHashMap<>();
        for (Story story : activeStories) {
            if ((reportedUserIds != null && reportedUserIds.contains(story.getUser().getId()))
                    || reportedStorySet.contains(story.getId())) {
                continue;
            }
            if (story.isCloseFriendsOnly()) {
                boolean isAuthor = story.getUser().getId().equals(currentUserId);
                boolean isCloseFriend = !isAuthor
                        && closeFriendRepository.existsByUserIdAndFriendId(story.getUser().getId(), currentUserId);
                if (!isAuthor && !isCloseFriend) {
                    continue;
                }
            }
            userStoriesMap.computeIfAbsent(story.getUser().getId(), k -> new ArrayList<>()).add(story);
        }

        List<UserStoriesResponse> result = new ArrayList<>();
        for (Map.Entry<UUID, List<Story>> entry : userStoriesMap.entrySet()) {
            List<Story> list = entry.getValue();
            if (list.isEmpty())
                continue;

            User author = list.get(0).getUser();
            List<StoryResponse> storyResponses = list.stream()
                    .map(s -> toStoryResponse(s, currentUserId))
                    .toList();

            boolean allViewed = storyResponses.stream().allMatch(StoryResponse::isViewed);
            boolean hasCloseFriendsStories = storyResponses.stream().anyMatch(StoryResponse::isCloseFriendsOnly);

            result.add(UserStoriesResponse.builder()
                    .user(UserSummaryResponse.builder()
                            .id(author.getId())
                            .username(author.getUsername())
                            .displayName(author.getProfile() != null ? author.getProfile().getDisplayName() : null)
                            .avatarUrl(author.getProfile() != null ? author.getProfile().getAvatarUrl() : null)
                            .hasActiveStories(true)
                            .hasUnseenStories(!allViewed)
                            .hasCloseFriendsStories(hasCloseFriendsStories)
                            .build())
                    .stories(storyResponses)
                    .allViewed(allViewed)
                    .hasCloseFriendsStories(hasCloseFriendsStories)
                    .build());
        }

        // Sorting: author first, then unseen stories, then seen stories
        result.sort((a, b) -> {
            boolean aIsSelf = a.getUser().getId().equals(currentUserId);
            boolean bIsSelf = b.getUser().getId().equals(currentUserId);
            if (aIsSelf)
                return -1;
            if (bIsSelf)
                return 1;
            if (!a.isAllViewed() && b.isAllViewed())
                return -1;
            if (a.isAllViewed() && !b.isAllViewed())
                return 1;
            return 0;
        });

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public UserStoriesResponse getUserStories(UUID userId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        boolean isAdmin = SecurityUtils.isCurrentUserAdmin();

        if (!isAdmin && privacyService.isBlockedBidirectional(currentUserId, userId)) {
            throw new ResourceNotFoundException("User not found");
        }

        List<UUID> reportedUserList = reportRepository.findReportedUserIdsByReporterId(currentUserId);
        if (!isAdmin && reportedUserList != null && reportedUserList.contains(userId)) {
            throw new ResourceNotFoundException("User not found");
        }

        // Check if creator hid stories from current user
        if (!isAdmin && userStoryHiddenUserRepository.existsByUserIdAndHiddenUserId(userId, currentUserId)) {
            return UserStoriesResponse.builder()
                    .stories(Collections.emptyList())
                    .allViewed(true)
                    .hasCloseFriendsStories(false)
                    .build();
        }

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + userId));

        // Private account verification
        UserSettings settings = userSettingsRepository.findByUserId(userId).orElse(null);
        boolean isAuthor = currentUserId.equals(userId);
        if (!isAdmin && !isAuthor && settings != null && settings.isPrivate()) {
            boolean isFollowing = followService.isFollowing(currentUserId, userId);
            if (!isFollowing) {
                throw new ForbiddenException("This account is private");
            }
        }

        LocalDateTime now = LocalDateTime.now();
        List<Story> activeStories = storyRepository.findActiveStoriesByUserId(userId, now);

        boolean isCloseFriend = !isAuthor && closeFriendRepository.existsByUserIdAndFriendId(userId, currentUserId);
        List<StoryResponse> list = activeStories.stream()
                .filter(s -> !s.isCloseFriendsOnly() || isAuthor || isCloseFriend || isAdmin)
                .map(s -> toStoryResponse(s, currentUserId))
                .toList();

        boolean allViewed = !list.isEmpty() && list.stream().allMatch(StoryResponse::isViewed);
        boolean hasCloseFriendsStories = list.stream().anyMatch(StoryResponse::isCloseFriendsOnly);

        return UserStoriesResponse.builder()
                .user(UserSummaryResponse.builder()
                        .id(author.getId())
                        .username(author.getUsername())
                        .displayName(author.getProfile() != null ? author.getProfile().getDisplayName() : null)
                        .avatarUrl(author.getProfile() != null ? author.getProfile().getAvatarUrl() : null)
                        .hasActiveStories(!list.isEmpty())
                        .hasUnseenStories(!list.isEmpty() && !allViewed)
                        .hasCloseFriendsStories(hasCloseFriendsStories)
                        .build())
                .stories(list)
                .allViewed(allViewed)
                .hasCloseFriendsStories(hasCloseFriendsStories)
                .build();
    }

    @Override
    public void markStoryViewed(UUID storyId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        String lockKey = StoryConstants.CACHE_STORY_VIEW_LOCK_PREFIX + storyId + ":" + currentUserId;
        String lockOwner = UUID.randomUUID().toString();
        Duration lease = Duration.ofSeconds(5);

        if (!acquireLockWithRetry(lockKey, lockOwner, lease, 3, 50)) {
            return;
        }

        try {
            TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
            txTemplate.executeWithoutResult(status -> {
                Story story = storyRepository.findById(storyId)
                        .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + storyId));

                // The story author viewing their own story must NEVER be counted or recorded as
                // a view
                if (story.getUser().getId().equals(currentUserId)) {
                    return;
                }

                privacyService.validateCanViewUserContent(currentUserId, story.getUser().getId());

                if (story.isCloseFriendsOnly()) {
                    boolean isAuthor = story.getUser().getId().equals(currentUserId);
                    boolean isCloseFriend = !isAuthor
                            && closeFriendRepository.existsByUserIdAndFriendId(story.getUser().getId(), currentUserId);
                    if (!isAuthor && !isCloseFriend) {
                        throw new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + storyId);
                    }
                }

                if (!storyViewRepository.existsByStoryIdAndUserId(storyId, currentUserId)) {
                    User viewer = userRepository.findById(currentUserId)
                            .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_CURRENT_USER_NOT_FOUND));

                    StoryView view = StoryView.builder()
                            .story(story)
                            .user(viewer)
                            .viewedAt(LocalDateTime.now())
                            .build();

                    try {
                        storyViewRepository.save(view);
                        storyInsightRepository.findByStoryId(storyId).ifPresent(ins -> {
                            ins.setImpressions(ins.getImpressions() + 1);
                            ins.setReach(ins.getReach() + 1);
                            storyInsightRepository.save(ins);
                        });
                    } catch (Exception ex) {
                        log.debug("Story view record already persisted concurrently for story: {}, user: {}", storyId,
                                currentUserId);
                    }
                }
            });
        } finally {
            lockService.releaseLock(lockKey, lockOwner);
        }
    }

    @Override
    @Transactional
    public void deleteStory(UUID storyId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + storyId));

        boolean isAdmin = SecurityUtils.isCurrentUserAdmin();
        if (!story.getUser().getId().equals(currentUserId) && !isAdmin) {
            throw new ForbiddenException(StoryConstants.ERR_UNAUTHORIZED_DELETE);
        }

        story.softDelete();
        storyRepository.save(story);
        log.info("Story {} soft-deleted by user {} (admin: {})", storyId, currentUserId, isAdmin);

        // Cascade cleanup: remove deleted story from all highlights
        List<StoryHighlightItem> itemsContainingStory = storyHighlightItemRepository.findByStoryId(storyId);
        Set<UUID> affectedHighlightIds = itemsContainingStory.stream()
                .map(item -> item.getHighlight().getId())
                .collect(Collectors.toSet());

        storyHighlightItemRepository.deleteByStoryId(storyId);

        for (UUID hlId : affectedHighlightIds) {
            storyHighlightRepository.findByIdWithItems(hlId).ifPresent(hl -> {
                List<StoryHighlightItem> remaining = hl.getItems();
                if (remaining != null) {
                    remaining.removeIf(it -> it.getStory() == null || it.getStory().getId().equals(storyId));
                }
                if (remaining == null || remaining.isEmpty()) {
                    storyHighlightRepository.delete(hl);
                    log.info("Deleted empty highlight {} after its last story {} was deleted", hlId, storyId);
                } else if (hl.getCoverImageUrl() != null && hl.getCoverImageUrl().equals(story.getMediaUrl())) {
                    String fallbackCover = remaining.get(0).getStory().getMediaUrl();
                    hl.setCoverImageUrl(fallbackCover);
                    storyHighlightRepository.save(hl);
                    log.info("Updated cover image for highlight {} after story {} was deleted", hlId, storyId);
                }
            });
        }

        if (isAdmin && !story.getUser().getId().equals(currentUserId)) {
            try {
                notificationService.createNotification(
                        story.getUser().getId(),
                        currentUserId,
                        NotificationType.CONTENT_REMOVED,
                        null,
                        null,
                        null,
                        null);
            } catch (Exception e) {
                log.warn("Failed to send content removal notification for story {}: {}", storyId, e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public int cleanupExpiredStories() {
        LocalDateTime now = LocalDateTime.now();
        List<Story> storiesToArchive = storyRepository.findStoriesToAutoArchive(now);
        for (Story story : storiesToArchive) {
            story.setIsArchived(true);
            storyRepository.save(story);
        }
        log.info("Auto-archived {} expired stories into owner archives at {}", storiesToArchive.size(), now);

        // Retention cleanup for soft-deleted stories based on DynamicDeletionConfig
        int retentionDays = 30;
        try {
            retentionDays = dynamicDeletionConfigService.getActiveConfig().getTrashRetentionDays();
        } catch (Exception e) {
            log.warn("Could not read DynamicDeletionConfig, falling back to 30 days");
        }
        LocalDateTime retentionThreshold = now.minusDays(retentionDays);
        List<Story> deletedStories = storyRepository.findDeletedStoriesOlderThan(retentionThreshold);
        for (Story deleted : deletedStories) {
            try {
                mediaService.deleteByUrl(deleted.getMediaUrl());
            } catch (Exception ex) {
                log.warn("Failed to delete expired story media asset: {}", ex.getMessage());
            }
            storyPollVoteRepository.deleteByStoryId(deleted.getId());
            storyPollRepository.deleteByStoryId(deleted.getId());
            storyLikeRepository.deleteByStoryId(deleted.getId());
            storyMentionRepository.deleteByStoryId(deleted.getId());
            storyViewRepository.deleteByStoryId(deleted.getId());
            storyRepository.delete(deleted);
        }
        return storiesToArchive.size() + deletedStories.size();
    }

    @Override
    @Transactional
    public List<StoryViewerResponse> getStoryViewers(UUID storyId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + storyId));

        if (!story.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException(StoryConstants.ERR_UNAUTHORIZED_VIEWERS);
        }

        // Clean up any historical self-view so author is never stored as a viewer
        try {
            storyViewRepository.deleteByStoryIdAndUserId(storyId, currentUserId);
        } catch (Exception ex) {
            log.debug("Could not delete self-view: {}", ex.getMessage());
        }

        List<StoryView> views = storyViewRepository.findByStoryIdWithUser(storyId);
        List<StoryLike> likes = storyLikeRepository.findByStoryId(storyId);
        Set<UUID> likedUserIds = likes.stream()
                .map(l -> l.getUser().getId())
                .collect(Collectors.toSet());

        return views.stream()
                .filter(v -> v.getUser() != null && !v.getUser().getId().equals(story.getUser().getId()))
                .map(v -> {
                    User u = v.getUser();
                    return StoryViewerResponse.builder()
                            .id(u.getId())
                            .username(u.getUsername())
                            .displayName(u.getProfile() != null && u.getProfile().getDisplayName() != null
                                    ? u.getProfile().getDisplayName()
                                    : u.getUsername())
                            .avatarUrl(u.getProfile() != null ? u.getProfile().getAvatarUrl() : null)
                            .viewedAt(v.getViewedAt())
                            .hasLiked(likedUserIds.contains(u.getId()))
                            .build();
                }).toList();
    }

    @Override
    @Transactional
    public StoryLikeResponse toggleLikeStory(UUID storyId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + storyId));

        if (story.isCloseFriendsOnly()) {
            boolean isAuthor = story.getUser().getId().equals(currentUserId);
            boolean isCloseFriend = !isAuthor
                    && closeFriendRepository.existsByUserIdAndFriendId(story.getUser().getId(), currentUserId);
            if (!isAuthor && !isCloseFriend) {
                throw new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + storyId);
            }
        }

        Optional<StoryLike> existingLike = storyLikeRepository.findByStoryIdAndUserId(storyId, currentUserId);
        boolean liked;

        if (existingLike.isPresent()) {
            storyLikeRepository.delete(existingLike.get());
            liked = false;
        } else {
            User user = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_CURRENT_USER_NOT_FOUND));

            StoryLike newLike = StoryLike.builder()
                    .story(story)
                    .user(user)
                    .build();

            storyLikeRepository.save(newLike);
            liked = true;

            if (!story.getUser().getId().equals(currentUserId)) {
                notificationService.createNotification(
                        story.getUser().getId(),
                        currentUserId,
                        NotificationType.STORY_LIKED,
                        null,
                        null);
            }
        }

        long likeCount = storyLikeRepository.countByStoryId(storyId);
        return StoryLikeResponse.builder()
                .storyId(storyId)
                .liked(liked)
                .likeCount(likeCount)
                .build();
    }

    // ==================== STORY HIGHLIGHTS ====================

    @Override
    @Transactional
    public HighlightSummaryResponse createHighlight(CreateHighlightRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_CURRENT_USER_NOT_FOUND));

        if (request.getStoryIds() == null || request.getStoryIds().isEmpty()) {
            throw new BadRequestException(StoryConstants.ERR_HIGHLIGHT_STORIES_EMPTY);
        }

        List<Story> stories = storyRepository.findAllById(request.getStoryIds());
        Map<UUID, Story> storyMap = stories.stream().collect(Collectors.toMap(Story::getId, s -> s));

        for (UUID sId : request.getStoryIds()) {
            Story s = storyMap.get(sId);
            if (s == null) {
                throw new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + sId);
            }
            if (!s.getUser().getId().equals(currentUserId)) {
                throw new ForbiddenException(StoryConstants.ERR_UNAUTHORIZED_HIGHLIGHT_STORY);
            }
        }

        String coverUrl = request.getCoverImageUrl();
        if ((coverUrl == null || coverUrl.isBlank()) && !stories.isEmpty()) {
            coverUrl = stories.get(0).getMediaUrl();
        }

        StoryHighlight highlight = StoryHighlight.builder()
                .user(currentUser)
                .title(request.getTitle().trim())
                .coverImageUrl(coverUrl)
                .build();

        StoryHighlight savedHighlight = storyHighlightRepository.save(highlight);

        List<StoryHighlightItem> items = new ArrayList<>();
        int index = 0;
        for (UUID sId : request.getStoryIds()) {
            StoryHighlightItem item = StoryHighlightItem.builder()
                    .highlight(savedHighlight)
                    .story(storyMap.get(sId))
                    .orderIndex(index++)
                    .build();
            items.add(item);
        }
        storyHighlightItemRepository.saveAll(items);

        return HighlightSummaryResponse.builder()
                .id(savedHighlight.getId())
                .title(savedHighlight.getTitle())
                .coverImageUrl(mediaUrlService.maskUrl(savedHighlight.getCoverImageUrl()))
                .storyCount(items.size())
                .createdAt(savedHighlight.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public HighlightDetailResponse getHighlightById(UUID highlightId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        StoryHighlight highlight = storyHighlightRepository.findByIdWithItems(highlightId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_HIGHLIGHT_NOT_FOUND + highlightId));

        User author = highlight.getUser();
        boolean isOwner = author.getId().equals(currentUserId);

        if (!isOwner && privacyService.isBlockedBidirectional(currentUserId, author.getId())) {
            throw new ResourceNotFoundException(StoryConstants.ERR_HIGHLIGHT_NOT_FOUND + highlightId);
        }

        List<StoryHighlightItem> items = highlight.getItems();
        if (items != null) {
            items.removeIf(item -> item.getStory() == null || Boolean.TRUE.equals(item.getStory().getIsDeleted()));
            items.sort(Comparator.comparingInt(StoryHighlightItem::getOrderIndex));
        } else {
            items = Collections.emptyList();
        }

        List<StoryResponse> storyResponses = items.stream()
                .map(item -> toStoryResponse(item.getStory(), currentUserId))
                .toList();

        return HighlightDetailResponse.builder()
                .id(highlight.getId())
                .title(highlight.getTitle())
                .coverImageUrl(mediaUrlService.maskUrl(highlight.getCoverImageUrl()))
                .author(PostAuthorResponse.builder()
                        .id(author.getId())
                        .username(author.getUsername())
                        .displayName(author.getProfile() != null ? author.getProfile().getDisplayName() : null)
                        .avatarUrl(author.getProfile() != null
                                ? mediaUrlService.maskUrl(author.getProfile().getAvatarUrl())
                                : null)
                        .build())
                .stories(storyResponses)
                .createdAt(highlight.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<HighlightSummaryResponse> getUserHighlights(UUID userId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (privacyService.isBlockedBidirectional(currentUserId, userId)) {
            return Collections.emptyList();
        }

        List<StoryHighlight> highlights = storyHighlightRepository.findByUserIdWithItems(userId);
        return highlights.stream()
                .filter(h -> {
                    if (h.getItems() != null) {
                        h.getItems().removeIf(it -> it.getStory() == null || Boolean.TRUE.equals(it.getStory().getIsDeleted()));
                        return !h.getItems().isEmpty();
                    }
                    return false;
                })
                .map(h -> HighlightSummaryResponse.builder()
                        .id(h.getId())
                        .title(h.getTitle())
                        .coverImageUrl(mediaUrlService.maskUrl(h.getCoverImageUrl()))
                        .storyCount(h.getItems() != null ? h.getItems().size() : 0)
                        .createdAt(h.getCreatedAt())
                        .build()
                ).toList();
    }

    @Override
    @Transactional
    public HighlightSummaryResponse updateHighlight(UUID highlightId, UpdateHighlightRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        StoryHighlight highlight = storyHighlightRepository.findByIdWithItems(highlightId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_HIGHLIGHT_NOT_FOUND + highlightId));

        if (!highlight.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException(StoryConstants.ERR_UNAUTHORIZED_HIGHLIGHT_UPDATE);
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            highlight.setTitle(request.getTitle().trim());
        }
        if (request.getCoverImageUrl() != null && !request.getCoverImageUrl().isBlank()) {
            highlight.setCoverImageUrl(request.getCoverImageUrl().trim());
        }

        if (request.getStoryIds() != null) {
            List<Story> stories = storyRepository.findAllById(request.getStoryIds());
            Map<UUID, Story> storyMap = stories.stream()
                    .collect(Collectors.toMap(Story::getId, s -> s, (s1, s2) -> s1));

            // In-place collection update for Hibernate orphanRemoval=true.
            // Do NOT reassign highlight.setItems(newItems) as replacing the persistent collection causes HibernateException.
            if (highlight.getItems() == null) {
                highlight.setItems(new ArrayList<>());
            } else {
                highlight.getItems().clear();
            }

            // Flush the removal of orphans before adding new items
            storyHighlightRepository.flush();

            Set<UUID> seenIds = new HashSet<>();
            int index = 0;
            for (UUID sId : request.getStoryIds()) {
                if (sId == null || !seenIds.add(sId)) {
                    continue;
                }
                Story s = storyMap.get(sId);
                if (s == null || !s.getUser().getId().equals(currentUserId) || Boolean.TRUE.equals(s.getIsDeleted())) {
                    continue;
                }
                StoryHighlightItem item = StoryHighlightItem.builder()
                        .highlight(highlight)
                        .story(s)
                        .orderIndex(index++)
                        .build();
                highlight.getItems().add(item);
            }

            if (highlight.getItems().isEmpty()) {
                throw new BadRequestException(StoryConstants.ERR_HIGHLIGHT_STORIES_EMPTY);
            }

            if ((highlight.getCoverImageUrl() == null || highlight.getCoverImageUrl().isBlank()) && !highlight.getItems().isEmpty()) {
                highlight.setCoverImageUrl(highlight.getItems().get(0).getStory().getMediaUrl());
            }
        }

        StoryHighlight updated = storyHighlightRepository.save(highlight);
        return HighlightSummaryResponse.builder()
                .id(updated.getId())
                .title(updated.getTitle())
                .coverImageUrl(updated.getCoverImageUrl())
                .storyCount(updated.getItems() != null ? updated.getItems().size() : 0)
                .createdAt(updated.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteHighlight(UUID highlightId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        StoryHighlight highlight = storyHighlightRepository.findById(highlightId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_HIGHLIGHT_NOT_FOUND + highlightId));

        if (!highlight.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException(StoryConstants.ERR_UNAUTHORIZED_HIGHLIGHT_DELETE);
        }

        storyHighlightRepository.delete(highlight);
    }

    @Override
    @Transactional
    public HighlightDetailResponse addStoriesToHighlight(UUID highlightId, AddHighlightItemsRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        StoryHighlight highlight = storyHighlightRepository.findByIdWithItems(highlightId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_HIGHLIGHT_NOT_FOUND + highlightId));

        if (!highlight.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException(StoryConstants.ERR_UNAUTHORIZED_HIGHLIGHT_UPDATE);
        }

        List<Story> stories = storyRepository.findAllById(request.getStoryIds());
        int currentIndex = highlight.getItems() != null ? highlight.getItems().size() : 0;
        List<StoryHighlightItem> newItems = new ArrayList<>();

        for (Story s : stories) {
            if (s.getUser().getId().equals(currentUserId) && !Boolean.TRUE.equals(s.getIsDeleted())) {
                newItems.add(StoryHighlightItem.builder()
                        .highlight(highlight)
                        .story(s)
                        .orderIndex(currentIndex++)
                        .build());
            }
        }
        storyHighlightItemRepository.saveAll(newItems);
        if (highlight.getItems() != null) {
            highlight.getItems().addAll(newItems);
        }
        return getHighlightById(highlightId);
    }

    @Override
    @Transactional
    public void removeStoryFromHighlight(UUID highlightId, UUID storyId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        StoryHighlight highlight = storyHighlightRepository.findById(highlightId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_HIGHLIGHT_NOT_FOUND + highlightId));

        if (!highlight.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException(StoryConstants.ERR_UNAUTHORIZED_HIGHLIGHT_UPDATE);
        }

        storyHighlightItemRepository.deleteByStoryId(storyId);
        if (highlight.getItems() != null) {
            highlight.getItems().removeIf(item -> item.getStory().getId().equals(storyId));
        }
    }

    // ==================== ENGAGEMENT & REPLIES ====================

    @Override
    @Transactional
    public MessageResponse replyToStory(UUID storyId, StoryReplyRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + storyId));

        if (story.getUser().getId().equals(currentUserId)) {
            throw new BadRequestException("You cannot reply to your own story");
        }

        // Privacy: Verify Story Reply Permissions
        UserSettings authorSettings = userSettingsRepository.findByUserId(story.getUser().getId()).orElse(null);
        if (authorSettings != null) {
            StoryReplyPermission permission = authorSettings.getStoryRepliesAllowed();
            if (permission == StoryReplyPermission.OFF) {
                throw new ForbiddenException("Story replies are turned off for this account");
            } else if (permission == StoryReplyPermission.FOLLOWING) {
                boolean isFollowing = followService.isFollowing(currentUserId, story.getUser().getId());
                if (!isFollowing) {
                    throw new ForbiddenException("Story replies are only allowed from followers");
                }
            }
        }

        if (privacyService.isBlockedBidirectional(currentUserId, story.getUser().getId())) {
            throw new ForbiddenException("Cannot reply to this story");
        }

        ConversationResponse conversation = chatService.getOrCreateDirectConversation(story.getUser().getId());
        SendMessageRequest sendRequest = SendMessageRequest.builder()
                .content(request.getContent().trim())
                .messageType(MessageType.STORY_REPLY)
                .mediaUrl(story.getMediaUrl())
                .build();

        return chatService.sendMessage(conversation.getId(), sendRequest);
    }

    @Override
    @Transactional
    public MessageResponse reactToStory(UUID storyId, StoryReactionRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + storyId));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_CURRENT_USER_NOT_FOUND));

        StoryReaction reaction = storyReactionRepository
                .findByStoryIdAndUserIdAndEmoji(storyId, currentUserId, request.getEmoji())
                .orElseGet(() -> StoryReaction.builder()
                        .story(story)
                        .user(user)
                        .emoji(request.getEmoji())
                        .build());
        storyReactionRepository.save(reaction);

        // Forward quick emoji reaction into Direct Message chat thread
        if (!story.getUser().getId().equals(currentUserId)) {
            try {
                ConversationResponse conversation = chatService.getOrCreateDirectConversation(story.getUser().getId());
                SendMessageRequest sendRequest = SendMessageRequest.builder()
                        .content(request.getEmoji())
                        .messageType(MessageType.STORY_REPLY)
                        .mediaUrl(story.getMediaUrl())
                        .build();
                return chatService.sendMessage(conversation.getId(), sendRequest);
            } catch (Exception ex) {
                log.warn("Could not dispatch DM reaction for story {}: {}", storyId, ex.getMessage());
            }
        }
        return null;
    }

    @Override
    @Transactional
    public StoryPollResponse voteOnPoll(UUID storyId, StoryPollVoteRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        StoryPoll poll = storyPollRepository.findByStoryId(storyId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_POLL_NOT_FOUND + storyId));

        if (request.getSelectedOption() != 1 && request.getSelectedOption() != 2) {
            throw new BadRequestException(StoryConstants.ERR_POLL_INVALID_OPTION);
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_CURRENT_USER_NOT_FOUND));

        Optional<StoryPollVote> existingVote = storyPollVoteRepository.findByPollIdAndUserId(poll.getId(),
                currentUserId);
        if (existingVote.isPresent()) {
            StoryPollVote v = existingVote.get();
            v.setSelectedOption(request.getSelectedOption());
            storyPollVoteRepository.save(v);
        } else {
            StoryPollVote vote = StoryPollVote.builder()
                    .poll(poll)
                    .user(user)
                    .selectedOption(request.getSelectedOption())
                    .build();
            storyPollVoteRepository.save(vote);
        }

        return toStoryPollResponse(poll, currentUserId);
    }

    @Override
    @Transactional
    public StoryQuizResponse voteOnQuiz(UUID storyId, StoryQuizVoteRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        StoryQuiz quiz = storyQuizRepository.findByStoryId(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("No quiz found on story: " + storyId));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_CURRENT_USER_NOT_FOUND));

        Optional<StoryQuizVote> existingVote = storyQuizVoteRepository.findByQuizIdAndUserId(quiz.getId(),
                currentUserId);
        if (existingVote.isPresent()) {
            StoryQuizVote v = existingVote.get();
            v.setSelectedOption(request.getSelectedOption());
            storyQuizVoteRepository.save(v);
        } else {
            StoryQuizVote vote = StoryQuizVote.builder()
                    .quiz(quiz)
                    .user(user)
                    .selectedOption(request.getSelectedOption())
                    .build();
            storyQuizVoteRepository.save(vote);
        }

        return toStoryQuizResponse(quiz, currentUserId);
    }

    @Override
    @Transactional
    public StorySliderResponse voteOnSlider(UUID storyId, StorySliderVoteRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        StorySlider slider = storySliderRepository.findByStoryId(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("No slider found on story: " + storyId));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_CURRENT_USER_NOT_FOUND));

        Optional<StorySliderVote> existingVote = storySliderVoteRepository.findBySliderIdAndUserId(slider.getId(),
                currentUserId);
        if (existingVote.isPresent()) {
            StorySliderVote v = existingVote.get();
            v.setSliderValue(request.getSliderValue());
            storySliderVoteRepository.save(v);
        } else {
            StorySliderVote vote = StorySliderVote.builder()
                    .slider(slider)
                    .user(user)
                    .sliderValue(request.getSliderValue())
                    .build();
            storySliderVoteRepository.save(vote);
        }

        return toStorySliderResponse(slider, currentUserId);
    }

    @Override
    @Transactional
    public StoryCountdownResponse toggleCountdownReminder(UUID storyId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        StoryCountdown countdown = storyCountdownRepository.findByStoryId(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("No countdown found on story: " + storyId));

        Optional<StoryCountdownSubscriber> existing = storyCountdownSubscriberRepository
                .findByCountdownIdAndUserId(countdown.getId(), currentUserId);
        boolean subscribed;

        if (existing.isPresent()) {
            storyCountdownSubscriberRepository.delete(existing.get());
            subscribed = false;
        } else {
            User user = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_CURRENT_USER_NOT_FOUND));
            storyCountdownSubscriberRepository.save(StoryCountdownSubscriber.builder()
                    .countdown(countdown)
                    .user(user)
                    .build());
            subscribed = true;
        }

        return StoryCountdownResponse.builder()
                .id(countdown.getId())
                .title(countdown.getTitle())
                .targetDate(countdown.getTargetDate())
                .hasSubscribed(subscribed)
                .totalSubscribers(storyCountdownSubscriberRepository.findAll().stream()
                        .filter(s -> s.getCountdown().getId().equals(countdown.getId())).count())
                .build();
    }

    // ==================== STORY ARCHIVE & MEMORIES ====================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StoryArchiveItemResponse> getStoryArchive(Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        LocalDateTime now = LocalDateTime.now();

        Page<Story> page = storyRepository.findArchivedStoriesByUserId(currentUserId, now, pageable);
        List<StoryArchiveItemResponse> list = page.getContent().stream().map(s -> StoryArchiveItemResponse.builder()
                .id(s.getId())
                .mediaUrl(mediaUrlService.maskUrl(s.getMediaUrl()))
                .mediaType(s.getMediaType())
                .caption(s.getCaption())
                .createdAt(s.getCreatedAt())
                .expiresAt(s.getExpiresAt())
                .viewCount(storyViewRepository.countByStoryIdAndAuthorNot(s.getId(), s.getUser().getId()))
                .likeCount(storyLikeRepository.countByStoryId(s.getId()))
                .isCloseFriendsOnly(s.isCloseFriendsOnly())
                .isArchived(Boolean.TRUE.equals(s.getIsArchived()) || s.getExpiresAt().isBefore(now))
                .build()).toList();

        return PageResponse.of(page, list);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, List<StoryArchiveItemResponse>> getStoryArchiveCalendar() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        LocalDateTime now = LocalDateTime.now();
        List<Story> allArchived = storyRepository.findAllArchivedStoriesByUserId(currentUserId, now);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        return allArchived.stream().map(s -> StoryArchiveItemResponse.builder()
                .id(s.getId())
                .mediaUrl(mediaUrlService.maskUrl(s.getMediaUrl()))
                .mediaType(s.getMediaType())
                .caption(s.getCaption())
                .createdAt(s.getCreatedAt())
                .expiresAt(s.getExpiresAt())
                .viewCount(storyViewRepository.countByStoryIdAndAuthorNot(s.getId(), s.getUser().getId()))
                .likeCount(storyLikeRepository.countByStoryId(s.getId()))
                .isCloseFriendsOnly(s.isCloseFriendsOnly())
                .isArchived(true)
                .build()).collect(Collectors.groupingBy(item -> item.getCreatedAt().format(formatter)));
    }

    @Override
    @Transactional
    public StoryResponse reshareArchivedStory(UUID storyId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Story original = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + storyId));

        if (!original.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only reshare your own archived memories");
        }

        String memoryCaption = "Memory from "
                + original.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM d, yyyy"));
        if (original.getCaption() != null && !original.getCaption().isBlank()) {
            memoryCaption += " • " + original.getCaption();
        }

        CreateStoryRequest reshareReq = CreateStoryRequest.builder()
                .mediaUrl(original.getMediaUrl())
                .mediaType(original.getMediaType())
                .caption(memoryCaption)
                .closeFriendsOnly(false)
                .build();

        StoryResponse res = createStory(reshareReq);
        Story s = storyRepository.findById(res.getId()).orElse(null);
        if (s != null) {
            s.setSharedStory(original);
            storyRepository.save(s);
            res.setSharedStoryId(original.getId());
        }
        return res;
    }

    // ==================== PRIVACY & VISIBILITY ====================

    @Override
    @Transactional
    public void hideStoryFromUser(UUID userId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId.equals(userId)) {
            throw new BadRequestException("You cannot hide your stories from yourself");
        }

        if (userStoryHiddenUserRepository.existsByUserIdAndHiddenUserId(currentUserId, userId)) {
            return;
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_CURRENT_USER_NOT_FOUND));
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + userId));

        userStoryHiddenUserRepository.save(UserStoryHiddenUser.builder()
                .user(user)
                .hiddenUser(target)
                .build());
    }

    @Override
    @Transactional
    public void unhideStoryFromUser(UUID userId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        userStoryHiddenUserRepository.deleteByUserIdAndHiddenUserId(currentUserId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getHiddenStoryUsers() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        return userStoryHiddenUserRepository.findByUserId(currentUserId).stream()
                .map(h -> {
                    User u = h.getHiddenUser();
                    return UserSummaryResponse.builder()
                            .id(u.getId())
                            .username(u.getUsername())
                            .displayName(u.getProfile() != null ? u.getProfile().getDisplayName() : null)
                            .avatarUrl(u.getProfile() != null ? u.getProfile().getAvatarUrl() : null)
                            .build();
                }).toList();
    }

    // ==================== RESHARING ====================

    @Override
    @Transactional
    public StoryResponse sharePostToStory(UUID postId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Post post = postRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with ID: " + postId));

        if (privacyService.isBlockedBidirectional(currentUserId, post.getUser().getId())) {
            throw new ForbiddenException("Cannot share this post");
        }

        String mediaUrl = post.getMediaList() != null && !post.getMediaList().isEmpty()
                ? post.getMediaList().get(0).getMediaUrl()
                : "https://via.placeholder.com/600x800";

        CreateStoryRequest storyReq = CreateStoryRequest.builder()
                .mediaUrl(mediaUrl)
                .mediaType(MediaType.IMAGE)
                .caption("Shared post by @" + post.getUser().getUsername())
                .build();

        StoryResponse res = createStory(storyReq);
        Story s = storyRepository.findById(res.getId()).orElse(null);
        if (s != null) {
            s.setSharedPost(post);
            storyRepository.save(s);
            res.setSharedPostId(post.getId());
        }
        return res;
    }

    @Override
    @Transactional
    public StoryResponse shareReelToStory(UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Reel reel = reelRepository.findById(reelId)
                .filter(r -> !Boolean.TRUE.equals(r.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));

        if (privacyService.isBlockedBidirectional(currentUserId, reel.getUser().getId())) {
            throw new ForbiddenException("Cannot share this reel");
        }

        String mediaUrl = reel.getVideoUrl() != null ? reel.getVideoUrl() : reel.getThumbnailUrl();
        CreateStoryRequest storyReq = CreateStoryRequest.builder()
                .mediaUrl(mediaUrl)
                .mediaType(reel.getVideoUrl() != null ? MediaType.VIDEO : MediaType.IMAGE)
                .caption("Shared reel by @" + reel.getUser().getUsername())
                .build();

        StoryResponse res = createStory(storyReq);
        Story s = storyRepository.findById(res.getId()).orElse(null);
        if (s != null) {
            s.setSharedReel(reel);
            storyRepository.save(s);
            res.setSharedReelId(reel.getId());
        }
        return res;
    }

    @Override
    @Transactional
    public StoryResponse shareMentionedStory(UUID storyId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Story original = storyRepository.findById(storyId)
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()) && s.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + storyId));

        boolean wasMentioned = storyMentionRepository.findByStoryIdWithUser(storyId).stream()
                .anyMatch(m -> m.getMentionedUser().getId().equals(currentUserId));

        if (!wasMentioned) {
            throw new ForbiddenException("You can only reshare stories where you were @mentioned");
        }

        UserSettings authorSettings = userSettingsRepository.findByUserId(original.getUser().getId()).orElse(null);
        if (authorSettings != null && !authorSettings.isAllowStoryResharing()) {
            throw new ForbiddenException("Story resharing is disabled by the creator");
        }

        CreateStoryRequest storyReq = CreateStoryRequest.builder()
                .mediaUrl(original.getMediaUrl())
                .mediaType(original.getMediaType())
                .caption("Reposted from @" + original.getUser().getUsername())
                .build();

        StoryResponse res = createStory(storyReq);
        Story s = storyRepository.findById(res.getId()).orElse(null);
        if (s != null) {
            s.setSharedStory(original);
            storyRepository.save(s);
            res.setSharedStoryId(original.getId());
        }
        return res;
    }

    // ==================== REPORTING & INSIGHTS ====================

    @Override
    @Transactional
    public void reportStory(UUID storyId, StoryReportRequest request) {
        CreateReportRequest reportReq = CreateReportRequest.builder()
                .targetType(ReportTargetType.STORY)
                .targetId(storyId)
                .reasonCode(request.getReason() != null ? request.getReason() : "INAPPROPRIATE")
                .description(request.getDetails())
                .build();
        adminService.createReport(reportReq);

        // Auto-quarantine check based on DynamicModerationConfig threshold
        try {
            int threshold = dynamicModerationConfigService.getActiveConfig().getAutoQuarantineReportThreshold();
            long totalReports = reportRepository.countByTargetTypeAndTargetId(ReportTargetType.STORY, storyId);
            if (totalReports >= threshold) {
                storyRepository.findById(storyId).ifPresent(story -> {
                    story.softDelete();
                    storyRepository.save(story);
                    log.info("Story {} auto-quarantined: {} reports reached threshold {}", storyId, totalReports,
                            threshold);
                });
            }
        } catch (Exception ex) {
            log.warn("Could not evaluate auto-quarantine for story {}: {}", storyId, ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public StoryInsightResponse getStoryInsights(UUID storyId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + storyId));

        if (!story.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only the story author can view story insights");
        }

        StoryInsight insight = storyInsightRepository.findByStoryId(storyId)
                .orElseGet(() -> StoryInsight.builder()
                        .story(story)
                        .impressions(storyViewRepository.countByStoryIdAndAuthorNot(storyId, story.getUser().getId()))
                        .reach(storyViewRepository.countByStoryIdAndAuthorNot(storyId, story.getUser().getId()))
                        .forwards(0L)
                        .backwards(0L)
                        .exits(0L)
                        .replies(0L)
                        .profileVisits(0L)
                        .build());

        return StoryInsightResponse.builder()
                .storyId(storyId)
                .impressions(insight.getImpressions())
                .reach(insight.getReach())
                .forwards(insight.getForwards())
                .backwards(insight.getBackwards())
                .exits(insight.getExits())
                .replies(insight.getReplies())
                .profileVisits(insight.getProfileVisits())
                .build();
    }

    // ==================== HELPER MAPPERS ====================

    private StoryResponse toStoryResponse(Story story, UUID viewerId) {
        User u = story.getUser();
        boolean viewed = viewerId != null && storyViewRepository.existsByStoryIdAndUserId(story.getId(), viewerId);
        long viewCount = storyViewRepository.countByStoryIdAndAuthorNot(story.getId(), story.getUser().getId());
        boolean liked = viewerId != null && storyLikeRepository.existsByStoryIdAndUserId(story.getId(), viewerId);
        long likeCount = storyLikeRepository.countByStoryId(story.getId());

        List<StoryMentionResponse> mentionResponses = storyMentionRepository.findByStoryIdWithUser(story.getId())
                .stream().map(m -> {
                    User mu = m.getMentionedUser();
                    return StoryMentionResponse.builder()
                            .userId(mu.getId())
                            .username(mu.getUsername())
                            .displayName(mu.getProfile() != null && mu.getProfile().getDisplayName() != null
                                    ? mu.getProfile().getDisplayName()
                                    : mu.getUsername())
                            .avatarUrl(mu.getProfile() != null ? mediaUrlService.maskUrl(mu.getProfile().getAvatarUrl())
                                    : null)
                            .xPercent(m.getXPercent())
                            .yPercent(m.getYPercent())
                            .build();
                }).toList();

        StoryPoll poll = story.getPoll() != null ? story.getPoll()
                : storyPollRepository.findByStoryId(story.getId()).orElse(null);
        StoryPollResponse pollResponse = toStoryPollResponse(poll, viewerId);

        StoryQuestion question = story.getQuestion() != null ? story.getQuestion()
                : storyQuestionRepository.findByStoryId(story.getId()).orElse(null);
        StoryQuestionResponseDto questionDto = null;
        if (question != null) {
            boolean hasResponded = viewerId != null
                    && storyQuestionResponseRepository.existsByQuestionIdAndUserId(question.getId(), viewerId);
            long totalResponses = storyQuestionResponseRepository.findByQuestionIdOrderByCreatedAtDesc(question.getId())
                    .size();
            questionDto = StoryQuestionResponseDto.builder()
                    .id(question.getId())
                    .prompt(question.getPrompt())
                    .totalResponses(totalResponses)
                    .hasResponded(hasResponded)
                    .build();
        }

        StoryQuiz quiz = story.getQuiz() != null ? story.getQuiz()
                : storyQuizRepository.findByStoryId(story.getId()).orElse(null);
        StoryQuizResponse quizResponse = toStoryQuizResponse(quiz, viewerId);

        StorySlider slider = story.getSlider() != null ? story.getSlider()
                : storySliderRepository.findByStoryId(story.getId()).orElse(null);
        StorySliderResponse sliderResponse = toStorySliderResponse(slider, viewerId);

        StoryCountdown countdown = story.getCountdown() != null ? story.getCountdown()
                : storyCountdownRepository.findByStoryId(story.getId()).orElse(null);
        StoryCountdownResponse countdownResponse = null;
        if (countdown != null) {
            boolean hasSubscribed = viewerId != null
                    && storyCountdownSubscriberRepository.existsByCountdownIdAndUserId(countdown.getId(), viewerId);
            countdownResponse = StoryCountdownResponse.builder()
                    .id(countdown.getId())
                    .title(countdown.getTitle())
                    .targetDate(countdown.getTargetDate())
                    .hasSubscribed(hasSubscribed)
                    .build();
        }

        StoryAddYours addYours = story.getAddYours() != null ? story.getAddYours()
                : storyAddYoursRepository.findByStoryId(story.getId()).orElse(null);
        StoryAddYoursResponse addYoursResponse = null;
        if (addYours != null) {
            boolean hasParticipated = viewerId != null
                    && storyAddYoursEntryRepository.existsByAddYoursIdAndUserId(addYours.getId(), viewerId);
            long totalParticipants = storyAddYoursEntryRepository.countByAddYoursId(addYours.getId());
            addYoursResponse = StoryAddYoursResponse.builder()
                    .id(addYours.getId())
                    .promptText(addYours.getPromptText())
                    .hasParticipated(hasParticipated)
                    .totalParticipants(totalParticipants)
                    .build();
        }

        List<StoryLinkResponse> linkResponses = storyLinkRepository.findByStoryId(story.getId()).stream()
                .map(l -> StoryLinkResponse.builder()
                        .id(l.getId())
                        .url(l.getUrl())
                        .title(l.getTitle())
                        .xPercent(l.getXPercent())
                        .yPercent(l.getYPercent())
                        .build())
                .toList();

        List<StoryLocationResponse> locResponses = storyLocationRepository.findByStoryId(story.getId()).stream()
                .map(l -> StoryLocationResponse.builder()
                        .id(l.getId())
                        .locationName(l.getLocationName())
                        .latitude(l.getLatitude())
                        .longitude(l.getLongitude())
                        .xPercent(l.getXPercent())
                        .yPercent(l.getYPercent())
                        .build())
                .toList();

        List<StoryHashtagResponse> tagResponses = storyHashtagRepository.findByStoryId(story.getId()).stream()
                .map(t -> StoryHashtagResponse.builder()
                        .id(t.getId())
                        .hashtag(t.getHashtag())
                        .xPercent(t.getXPercent())
                        .yPercent(t.getYPercent())
                        .build())
                .toList();

        return StoryResponse.builder()
                .id(story.getId())
                .author(PostAuthorResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .displayName(u.getProfile() != null ? u.getProfile().getDisplayName() : null)
                        .avatarUrl(
                                u.getProfile() != null ? mediaUrlService.maskUrl(u.getProfile().getAvatarUrl()) : null)
                        .build())
                .mediaUrl(mediaUrlService.maskUrl(story.getMediaUrl()))
                .mediaType(story.getMediaType())
                .caption(story.getCaption())
                .closeFriendsOnly(story.isCloseFriendsOnly())
                .archived(Boolean.TRUE.equals(story.getIsArchived()))
                .audioTitle(story.getAudioTitle())
                .audioArtist(story.getAudioArtist())
                .audioUrl(story.getAudioUrl())
                .filterName(story.getFilterName())
                .sharedPostId(story.getSharedPost() != null ? story.getSharedPost().getId() : null)
                .sharedReelId(story.getSharedReel() != null ? story.getSharedReel().getId() : null)
                .sharedStoryId(story.getSharedStory() != null ? story.getSharedStory().getId() : null)
                .poll(pollResponse)
                .question(questionDto)
                .quiz(quizResponse)
                .slider(sliderResponse)
                .countdown(countdownResponse)
                .addYours(addYoursResponse)
                .links(linkResponses)
                .locations(locResponses)
                .hashtags(tagResponses)
                .mentions(mentionResponses)
                .viewed(viewed)
                .viewCount(viewCount)
                .liked(liked)
                .likeCount(likeCount)
                .expiresAt(story.getExpiresAt())
                .createdAt(story.getCreatedAt())
                .build();
    }

    private StoryPollResponse toStoryPollResponse(StoryPoll poll, UUID viewerId) {
        if (poll == null)
            return null;
        List<StoryPollVote> votes = storyPollVoteRepository.findByPollId(poll.getId());
        long voteCountA = votes.stream().filter(v -> v.getSelectedOption() == 1).count();
        long voteCountB = votes.stream().filter(v -> v.getSelectedOption() == 2).count();
        long total = votes.size();
        double percentA = total > 0 ? ((double) voteCountA / total) * 100.0 : 0.0;
        double percentB = total > 0 ? ((double) voteCountB / total) * 100.0 : 0.0;

        Integer userVote = viewerId != null
                ? votes.stream().filter(v -> v.getUser().getId().equals(viewerId)).map(StoryPollVote::getSelectedOption)
                        .findFirst().orElse(null)
                : null;

        return StoryPollResponse.builder()
                .id(poll.getId())
                .question(poll.getQuestion())
                .optionA(poll.getOptionA())
                .optionB(poll.getOptionB())
                .voteCountA(voteCountA)
                .voteCountB(voteCountB)
                .totalVotes(total)
                .percentA(percentA)
                .percentB(percentB)
                .userVote(userVote)
                .build();
    }

    private StoryQuizResponse toStoryQuizResponse(StoryQuiz quiz, UUID viewerId) {
        if (quiz == null)
            return null;
        List<StoryQuizVote> votes = storyQuizVoteRepository.findByQuizId(quiz.getId());
        Map<Integer, Long> counts = votes.stream()
                .collect(Collectors.groupingBy(StoryQuizVote::getSelectedOption, Collectors.counting()));

        Integer userVote = viewerId != null
                ? votes.stream().filter(v -> v.getUser().getId().equals(viewerId)).map(StoryQuizVote::getSelectedOption)
                        .findFirst().orElse(null)
                : null;

        List<String> options = Collections.emptyList();
        try {
            options = objectMapper.readValue(quiz.getOptionsJson(), new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            log.warn("Failed to parse quiz options JSON: {}", e.getMessage());
        }

        return StoryQuizResponse.builder()
                .id(quiz.getId())
                .question(quiz.getQuestion())
                .options(options)
                .correctOptionIndex(quiz.getCorrectOptionIndex())
                .optionVoteCounts(counts)
                .totalVotes(votes.size())
                .userVote(userVote)
                .build();
    }

    private StorySliderResponse toStorySliderResponse(StorySlider slider, UUID viewerId) {
        if (slider == null)
            return null;
        List<StorySliderVote> votes = storySliderVoteRepository.findBySliderId(slider.getId());
        double avg = votes.isEmpty() ? 0.0
                : votes.stream().mapToDouble(StorySliderVote::getSliderValue).average().orElse(0.0);

        Double userVote = viewerId != null
                ? votes.stream().filter(v -> v.getUser().getId().equals(viewerId)).map(StorySliderVote::getSliderValue)
                        .findFirst().orElse(null)
                : null;

        return StorySliderResponse.builder()
                .id(slider.getId())
                .question(slider.getQuestion())
                .emoji(slider.getEmoji())
                .averageValue(avg)
                .totalVotes(votes.size())
                .userVote(userVote)
                .build();
    }

    @Override
    @Transactional
    public void submitQuestionResponse(UUID storyId, CreateQuestionAnswerRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        StoryQuestion question = storyQuestionRepository.findByStoryId(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("No question sticker found on story: " + storyId));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserId));

        StoryQuestionResponse response = StoryQuestionResponse.builder()
                .question(question)
                .user(user)
                .responseText(request.getText().trim())
                .build();

        storyQuestionResponseRepository.save(response);
        log.info("User {} answered question on story {}", currentUserId, storyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StoryQuestionAnswerResponse> getQuestionResponses(UUID storyId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException(StoryConstants.ERR_STORY_NOT_FOUND + storyId));

        if (!story.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only the story author can view question responses");
        }

        StoryQuestion question = storyQuestionRepository.findByStoryId(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("No question sticker found on story: " + storyId));

        return storyQuestionResponseRepository.findByQuestionIdOrderByCreatedAtDesc(question.getId()).stream()
                .map(r -> {
                    User u = r.getUser();
                    return StoryQuestionAnswerResponse.builder()
                            .id(r.getId())
                            .respondent(UserSummaryResponse.builder()
                                    .id(u.getId())
                                    .username(u.getUsername())
                                    .displayName(u.getProfile() != null ? u.getProfile().getDisplayName() : null)
                                    .avatarUrl(u.getProfile() != null ? u.getProfile().getAvatarUrl() : null)
                                    .build())
                            .responseText(r.getResponseText())
                            .createdAt(r.getCreatedAt())
                            .build();
                })
                .toList();
    }
}
