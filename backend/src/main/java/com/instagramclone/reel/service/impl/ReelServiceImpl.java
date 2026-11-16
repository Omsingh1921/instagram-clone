package com.instagramclone.reel.service.impl;

import com.instagramclone.reel.service.interfaces.*;


import java.util.*;
import java.util.UUID;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ForbiddenException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import com.instagramclone.media.service.interfaces.IMediaService;
import com.instagramclone.media.service.interfaces.IMediaUrlService;
import com.instagramclone.reel.constants.ReelConstants;
import com.instagramclone.reel.dto.request.CreateReelRequest;
import com.instagramclone.reel.dto.request.UpdateReelRequest;
import com.instagramclone.reel.dto.response.ReelResponse;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.enums.ReelStatus;
import com.instagramclone.reel.repository.ReelRepository;
import com.instagramclone.user.constants.UserConstants;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReelServiceImpl implements IReelService {

    private static final Logger log = LoggerFactory.getLogger(ReelServiceImpl.class);

    private final ReelRepository reelRepository;
    private final UserRepository userRepository;
    private final IMediaService mediaService;
    private final IMediaUrlService mediaUrlService;
    private final IReelEngagementService reelEngagementService;
    private final com.instagramclone.security.service.interfaces.IPrivacyService privacyService;
    private final com.instagramclone.reel.repository.ReelLikeRepository reelLikeRepository;
    private final com.instagramclone.reel.repository.ReelCommentRepository reelCommentRepository;
    private final com.instagramclone.reel.repository.ReelViewRepository reelViewRepository;
    private final com.instagramclone.reel.repository.ReelNotInterestedRepository reelNotInterestedRepository;
    private final com.instagramclone.admin.service.interfaces.IAdminService adminService;
    private final com.instagramclone.notification.service.interfaces.INotificationService notificationService;
    private final com.instagramclone.audit.service.interfaces.IAuditLogService auditLogService;
    private final com.instagramclone.admin.service.interfaces.IDynamicDeletionConfigService dynamicDeletionConfigService;
    private final com.instagramclone.admin.service.interfaces.IDynamicFeatureFlagService dynamicFeatureFlagService;
    private final com.instagramclone.feed.service.interfaces.IUserAffinityService userAffinityService;
    private final com.instagramclone.feed.service.interfaces.IFeedRankingEngine feedRankingEngine;
    private final com.instagramclone.follow.repository.FollowRepository followRepository;
    private final com.instagramclone.admin.repository.ReportRepository reportRepository;

    @Override
    @Transactional
    public ReelResponse createReel(CreateReelRequest request) {
        if (dynamicFeatureFlagService != null && !Boolean.TRUE.equals(dynamicFeatureFlagService.getActiveConfig().getReelsUploadEnabled())) {
            throw new BadRequestException("Reels creation is temporarily disabled by platform administrators.");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User author = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + currentUserId));

        if (author.getRole() == Role.ROLE_ADMIN || "admin".equalsIgnoreCase(author.getUsername())) {
            throw new BadRequestException("Admin accounts cannot create reels");
        }

        if (request.getDurationMs() != null && request.getDurationMs() > 0) {
            long durationSec = request.getDurationMs() / 1000;
            if (durationSec < ReelConstants.MIN_DURATION_SECONDS || durationSec > ReelConstants.MAX_DURATION_SECONDS) {
                throw new BadRequestException(ReelConstants.MSG_INVALID_REEL_DURATION);
            }
        }

        Reel remixOf = null;
        if (request.getRemixReelId() != null) {
            remixOf = reelRepository.findById(request.getRemixReelId()).orElse(null);
        }

        Reel reel = Reel.builder()
                .user(author)
                .videoUrl(mediaUrlService.unmaskUrl(request.getVideoUrl().trim()))
                .thumbnailUrl(mediaUrlService.unmaskUrl(request.getThumbnailUrl()))
                .caption(request.getCaption())
                .audioTitle(request.getAudioTitle() != null && !request.getAudioTitle().isBlank() ? request.getAudioTitle().trim() : "Original Audio")
                .audioArtist(request.getAudioArtist() != null && !request.getAudioArtist().isBlank() ? request.getAudioArtist().trim() : author.getUsername())
                .durationMs(request.getDurationMs() != null ? request.getDurationMs() : 0L)
                .location(request.getLocation() != null ? request.getLocation().trim() : null)
                .hideLikeCount(Boolean.TRUE.equals(request.getHideLikeCount()))
                .commentsDisabled(Boolean.TRUE.equals(request.getCommentsDisabled()))
                .remixOfReel(remixOf)
                .status(ReelStatus.READY)
                .build();

        Reel saved = reelRepository.save(reel);
        log.info("Reel {} created by user {}", saved.getId(), author.getUsername());

        return toReelResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReelResponse> getReels(Pageable pageable) {
        return getReels(pageable, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReelResponse> getReels(Pageable pageable, Long seed) {
        UUID currentUserId = SecurityUtils.getCurrentUserPrincipal().map(com.instagramclone.security.principal.UserPrincipal::getId).orElse(null);
        int pageSize = pageable.getPageSize();
        int pageNumber = pageable.getPageNumber();
        int poolSize = Math.max(pageSize * 5, 25);

        Page<Reel> page = reelRepository.findFeedReels(ReelStatus.READY, currentUserId, PageRequest.of(0, poolSize));
        List<UUID> repUserIds = (currentUserId != null) ? reportRepository.findReportedUserIdsByReporterId(currentUserId) : Collections.emptyList();
        Set<UUID> repUserSet = (repUserIds != null) ? new HashSet<>(repUserIds) : Collections.emptySet();
        List<UUID> repReelIds = (currentUserId != null) ? reportRepository.findReportedReelIdsByReporterId(currentUserId) : Collections.emptyList();
        Set<UUID> repReelSet = (repReelIds != null) ? new HashSet<>(repReelIds) : Collections.emptySet();

        List<ReelResponse> reelResponses = page.getContent().stream()
                .filter(r -> r.getUser() != null && (currentUserId == null || !r.getUser().getId().equals(currentUserId)) && !repUserSet.contains(r.getUser().getId()) && !repReelSet.contains(r.getId()))
                .map(this::toReelResponse)
                .toList();

        if (reelResponses.isEmpty()) {
            return PageResponse.from(new org.springframework.data.domain.PageImpl<>(Collections.emptyList(), pageable, 0));
        }

        com.instagramclone.feed.dto.response.UserAffinityProfile profile = (currentUserId != null && userAffinityService != null)
                ? userAffinityService.getAffinityProfile(currentUserId)
                : null;
        List<UUID> followingList = (currentUserId != null && followRepository != null)
                ? followRepository.findFollowingIdsByFollowerId(currentUserId)
                : Collections.emptyList();
        Set<UUID> followingSet = followingList != null ? new HashSet<>(followingList) : Collections.emptySet();

        Set<UUID> seenSet = new HashSet<>();
        if (currentUserId != null) {
            if (reelViewRepository != null) {
                List<UUID> viewedList = reelViewRepository.findViewedReelIdsByUserId(currentUserId);
                if (viewedList != null) seenSet.addAll(viewedList);
            }
            if (userAffinityService != null) {
                Set<UUID> affinitySeen = userAffinityService.getSeenItemIds(currentUserId);
                if (affinitySeen != null) seenSet.addAll(affinitySeen);
            }
        }

        List<ReelResponse> unseen = reelResponses.stream()
                .filter(r -> r.getId() != null && !seenSet.contains(r.getId()))
                .toList();
        List<ReelResponse> seen = reelResponses.stream()
                .filter(r -> r.getId() != null && seenSet.contains(r.getId()))
                .toList();

        List<ReelResponse> combined;
        if (feedRankingEngine != null) {
            List<ReelResponse> rankedUnseen = !unseen.isEmpty()
                    ? feedRankingEngine.rankReelsFeed(currentUserId, unseen, profile, followingSet, seenSet, seed)
                    : Collections.emptyList();
            List<ReelResponse> rankedSeen = !seen.isEmpty()
                    ? feedRankingEngine.rankReelsFeed(currentUserId, seen, profile, followingSet, seenSet, seed)
                    : Collections.emptyList();

            combined = new ArrayList<>(rankedUnseen.size() + rankedSeen.size());
            combined.addAll(rankedUnseen);
            combined.addAll(rankedSeen);
        } else {
            combined = new ArrayList<>(unseen.size() + seen.size());
            combined.addAll(unseen);
            combined.addAll(seen);
        }

        int offset = (int) pageable.getOffset();
        int totalReels = combined.size();
        List<ReelResponse> pagedList;
        if (totalReels == 0) {
            pagedList = Collections.emptyList();
        } else {
            pagedList = new ArrayList<>(pageSize);
            for (int i = 0; i < pageSize; i++) {
                int circularIdx = (int) ((offset + i) % totalReels);
                pagedList.add(combined.get(circularIdx));
            }
        }

        // Automatically record served reel IDs as seen so subsequent refreshes never serve the same reels
        List<UUID> servedIds = pagedList.stream()
                .map(ReelResponse::getId)
                .filter(Objects::nonNull)
                .toList();
        if (currentUserId != null && userAffinityService != null && !servedIds.isEmpty()) {
            userAffinityService.recordSeenItems(currentUserId, servedIds);
        }

        long infiniteTotal = Math.max((long) totalReels, (long) (pageNumber + 5) * pageSize);
        return PageResponse.from(new org.springframework.data.domain.PageImpl<>(pagedList, pageable, infiniteTotal));
    }

    @Override
    @Transactional(readOnly = true)
    public ReelResponse getReelById(UUID reelId) {
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId));

        boolean isAdmin = SecurityUtils.isCurrentUserAdmin();
        if (!isAdmin) {
            if (Boolean.TRUE.equals(reel.getIsDeleted())) {
                throw new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId);
            }
            UUID currentUserId = SecurityUtils.getCurrentUserPrincipal().map(com.instagramclone.security.principal.UserPrincipal::getId).orElse(null);
            if (reel.isArchived() && (currentUserId == null || !reel.getUser().getId().equals(currentUserId))) {
                throw new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId);
            }
            if (reel.getUser().isDeletedOrDeactivated() || reel.getStatus() != ReelStatus.READY) {
                throw new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId);
            }
            privacyService.validateCanViewUserContent(currentUserId, reel.getUser().getId());
        }

        return toReelResponse(reel);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReelResponse> getUserReels(UUID userId, Pageable pageable) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + userId);
        }

        UUID currentUserId = SecurityUtils.getCurrentUserPrincipal().map(com.instagramclone.security.principal.UserPrincipal::getId).orElse(null);
        boolean isAdmin = SecurityUtils.isCurrentUserAdmin();
        if (!isAdmin) {
            privacyService.validateCanViewUserContent(currentUserId, userId);
        }

        Page<Reel> page = reelRepository.findByUserIdAndStatus(userId, ReelStatus.READY, pageable);
        return PageResponse.from(page.map(this::toReelResponse));
    }

    @Override
    @Transactional
    public void deleteReel(UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId));

        boolean isAdmin = SecurityUtils.isCurrentUserAdmin();
        if (!reel.getUser().getId().equals(currentUserId) && !isAdmin) {
            throw new ForbiddenException(ReelConstants.ERR_UNAUTHORIZED_DELETE);
        }

        reel.softDelete();
        reelRepository.save(reel);
        log.info("Reel {} soft-deleted by user {} (admin: {})", reelId, currentUserId, isAdmin);

        if (isAdmin && !reel.getUser().getId().equals(currentUserId)) {
            try {
                notificationService.createNotification(
                        reel.getUser().getId(),
                        currentUserId,
                        com.instagramclone.notification.enums.NotificationType.CONTENT_REMOVED,
                        null,
                        null,
                        reel.getId(),
                        reel.getThumbnailUrl()
                );
            } catch (Exception e) {
                log.warn("Failed to dispatch CONTENT_REMOVED notification for reel {}: {}", reelId, e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public ReelResponse restoreReel(UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId));

        if (!reel.getUser().getId().equals(currentUserId) && !SecurityUtils.isCurrentUserAdmin()) {
            throw new ForbiddenException("You are not authorized to restore this reel");
        }

        if (reel.isPermanentlyDeleted()) {
            throw new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId);
        }

        reel.restore();
        Reel saved = reelRepository.save(reel);
        log.info("Reel {} restored by user {}", reelId, currentUserId);
        return toReelResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReelResponse> getRecentlyDeletedReels(Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        int retentionDays = (dynamicDeletionConfigService != null && dynamicDeletionConfigService.getActiveConfig() != null)
                ? dynamicDeletionConfigService.getActiveConfig().getTrashRetentionDays()
                : 30;
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        Page<Reel> page = reelRepository.findRecentlyDeletedReels(currentUserId, cutoff, pageable);
        return PageResponse.from(page.map(this::toReelResponse));
    }

    @Override
    @Transactional
    public void permanentlyDeleteReel(UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId));

        if (!reel.getUser().getId().equals(currentUserId) && !SecurityUtils.isCurrentUserAdmin()) {
            throw new ForbiddenException("You are not authorized to permanently delete this reel");
        }

        // Pseudo-permanent soft delete:
        // Preserves Cloudinary media assets and DB records/engagement intact,
        // while marking the reel permanently deleted so it is completely invisible
        // in feeds, explore, profile grid, search, and recently deleted bin,
        // and cannot be restored by users.
        reel.markPermanentlyDeleted();
        reelRepository.save(reel);

        try {
            auditLogService.record(currentUserId, "REEL_PERMANENTLY_PURGED", "REEL", reelId, null, "Permanently deleted reel (pseudo-purged/soft-deleted)");
        } catch (Exception e) {
            log.warn("Failed to record audit log for permanent delete of reel {}: {}", reelId, e.getMessage());
        }

        log.info("Reel {} pseudo-permanently deleted (soft purge) by user {}", reelId, currentUserId);
    }

    @Override
    @Transactional
    public ReelResponse toggleArchiveReel(UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId));

        if (!reel.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to archive this reel");
        }

        if (reel.isArchived()) {
            reel.unarchive();
        } else {
            reel.archive();
        }

        Reel saved = reelRepository.save(reel);
        log.info("Reel {} archive status changed to {} by user {}", reelId, saved.isArchived(), currentUserId);
        return toReelResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReelResponse> getArchivedReels(Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Page<Reel> page = reelRepository.findArchivedReels(currentUserId, pageable);
        return PageResponse.from(page.map(this::toReelResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReelResponse> getSavedReels(Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Page<Reel> page = reelRepository.findSavedReels(currentUserId, pageable);
        return PageResponse.from(page.map(this::toReelResponse));
    }

    @Override
    @Transactional
    public ReelResponse updateReel(UUID reelId, UpdateReelRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId));

        if (!reel.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to edit this reel");
        }

        if (request.getCaption() != null) reel.setCaption(request.getCaption().trim());
        if (request.getLocation() != null) reel.setLocation(request.getLocation().trim());
        if (request.getAudioTitle() != null && !request.getAudioTitle().isBlank()) reel.setAudioTitle(request.getAudioTitle().trim());
        if (request.getAudioArtist() != null && !request.getAudioArtist().isBlank()) reel.setAudioArtist(request.getAudioArtist().trim());
        if (request.getHideLikeCount() != null) reel.setHideLikeCount(request.getHideLikeCount());
        if (request.getCommentsDisabled() != null) reel.setCommentsDisabled(request.getCommentsDisabled());

        Reel saved = reelRepository.save(reel);
        log.info("Reel {} updated by user {}", reelId, currentUserId);
        return toReelResponse(saved);
    }

    @Override
    @Transactional
    public ReelResponse togglePinReel(UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId));

        if (!reel.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to pin this reel");
        }

        boolean nextPinState = !reel.isPinned();
        if (nextPinState) {
            long pinnedCount = reelRepository.countByUserIdAndIsPinnedTrueAndIsDeletedFalse(currentUserId);
            if (pinnedCount >= 3) {
                throw new BadRequestException("You can only pin up to 3 reels to your profile");
            }
        }

        reel.setPinned(nextPinState);
        Reel saved = reelRepository.save(reel);
        return toReelResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReelResponse> getFollowingReels(Pageable pageable) {
        return getFollowingReels(pageable, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReelResponse> getFollowingReels(Pageable pageable, Long seed) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        int pageSize = pageable.getPageSize();
        int pageNumber = pageable.getPageNumber();
        int poolSize = Math.max(pageSize * 5, 25);

        Page<Reel> page = reelRepository.findFollowingReels(ReelStatus.READY, currentUserId, PageRequest.of(0, poolSize));
        List<UUID> fRepUserIds = (currentUserId != null) ? reportRepository.findReportedUserIdsByReporterId(currentUserId) : Collections.emptyList();
        Set<UUID> fRepUserSet = (fRepUserIds != null) ? new HashSet<>(fRepUserIds) : Collections.emptySet();
        List<UUID> fRepReelIds = (currentUserId != null) ? reportRepository.findReportedReelIdsByReporterId(currentUserId) : Collections.emptyList();
        Set<UUID> fRepReelSet = (fRepReelIds != null) ? new HashSet<>(fRepReelIds) : Collections.emptySet();

        List<ReelResponse> reelResponses = page.getContent().stream()
                .filter(r -> r.getUser() != null && (currentUserId == null || !r.getUser().getId().equals(currentUserId)) && !fRepUserSet.contains(r.getUser().getId()) && !fRepReelSet.contains(r.getId()))
                .map(this::toReelResponse)
                .toList();

        if (reelResponses.isEmpty()) {
            return PageResponse.from(new org.springframework.data.domain.PageImpl<>(Collections.emptyList(), pageable, 0));
        }

        com.instagramclone.feed.dto.response.UserAffinityProfile profile = userAffinityService != null
                ? userAffinityService.getAffinityProfile(currentUserId)
                : null;
        List<UUID> followingList = followRepository != null
                ? followRepository.findFollowingIdsByFollowerId(currentUserId)
                : Collections.emptyList();
        Set<UUID> followingSet = followingList != null ? new HashSet<>(followingList) : Collections.emptySet();

        Set<UUID> seenSet = new HashSet<>();
        if (currentUserId != null) {
            if (reelViewRepository != null) {
                List<UUID> viewedList = reelViewRepository.findViewedReelIdsByUserId(currentUserId);
                if (viewedList != null) seenSet.addAll(viewedList);
            }
            if (userAffinityService != null) {
                Set<UUID> affinitySeen = userAffinityService.getSeenItemIds(currentUserId);
                if (affinitySeen != null) seenSet.addAll(affinitySeen);
            }
        }

        List<ReelResponse> unseen = reelResponses.stream()
                .filter(r -> r.getId() != null && !seenSet.contains(r.getId()))
                .toList();
        List<ReelResponse> seen = reelResponses.stream()
                .filter(r -> r.getId() != null && seenSet.contains(r.getId()))
                .toList();

        List<ReelResponse> combined;
        if (feedRankingEngine != null) {
            List<ReelResponse> rankedUnseen = !unseen.isEmpty()
                    ? feedRankingEngine.rankReelsFeed(currentUserId, unseen, profile, followingSet, seenSet, seed)
                    : Collections.emptyList();
            List<ReelResponse> rankedSeen = !seen.isEmpty()
                    ? feedRankingEngine.rankReelsFeed(currentUserId, seen, profile, followingSet, seenSet, seed)
                    : Collections.emptyList();

            combined = new ArrayList<>(rankedUnseen.size() + rankedSeen.size());
            combined.addAll(rankedUnseen);
            combined.addAll(rankedSeen);
        } else {
            combined = new ArrayList<>(unseen.size() + seen.size());
            combined.addAll(unseen);
            combined.addAll(seen);
        }

        int offset = (int) pageable.getOffset();
        int totalReels = combined.size();
        List<ReelResponse> pagedList;
        if (totalReels == 0) {
            pagedList = Collections.emptyList();
        } else {
            pagedList = new ArrayList<>(pageSize);
            for (int i = 0; i < pageSize; i++) {
                int circularIdx = (int) ((offset + i) % totalReels);
                pagedList.add(combined.get(circularIdx));
            }
        }

        // Automatically record served reel IDs as seen so subsequent refreshes never serve the same reels
        List<UUID> servedIds = pagedList.stream()
                .map(ReelResponse::getId)
                .filter(Objects::nonNull)
                .toList();
        if (currentUserId != null && userAffinityService != null && !servedIds.isEmpty()) {
            userAffinityService.recordSeenItems(currentUserId, servedIds);
        }

        long infiniteTotal = Math.max((long) totalReels, (long) (pageNumber + 5) * pageSize);
        return PageResponse.from(new org.springframework.data.domain.PageImpl<>(pagedList, pageable, infiniteTotal));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReelResponse> getReelsByHashtag(String hashtag, Pageable pageable) {
        Page<Reel> page = reelRepository.findByHashtag(hashtag, pageable);
        return PageResponse.from(page.map(this::toReelResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReelResponse> getReelsByAudio(String audioTitle, Pageable pageable) {
        Page<Reel> page = reelRepository.findByAudioTitle(audioTitle, pageable);
        return PageResponse.from(page.map(this::toReelResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public long countReelsByAudio(String audioTitle) {
        return reelRepository.countByAudioTitle(audioTitle);
    }

    @Override
    @Transactional
    public ReelResponse createDraft(CreateReelRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User author = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + currentUserId));

        if (author.getRole() == Role.ROLE_ADMIN || "admin".equalsIgnoreCase(author.getUsername())) {
            throw new BadRequestException("Admin accounts cannot create reels");
        }

        if (request.getDurationMs() != null && request.getDurationMs() > 0) {
            long durationSec = request.getDurationMs() / 1000;
            if (durationSec < ReelConstants.MIN_DURATION_SECONDS || durationSec > ReelConstants.MAX_DURATION_SECONDS) {
                throw new BadRequestException(ReelConstants.MSG_INVALID_REEL_DURATION);
            }
        }

        Reel remixOf = null;
        if (request.getRemixReelId() != null) {
            remixOf = reelRepository.findById(request.getRemixReelId()).orElse(null);
        }

        Reel reel = Reel.builder()
                .user(author)
                .videoUrl(mediaUrlService.unmaskUrl(request.getVideoUrl().trim()))
                .thumbnailUrl(mediaUrlService.unmaskUrl(request.getThumbnailUrl()))
                .caption(request.getCaption())
                .audioTitle(request.getAudioTitle() != null && !request.getAudioTitle().isBlank() ? request.getAudioTitle().trim() : "Original Audio")
                .audioArtist(request.getAudioArtist() != null && !request.getAudioArtist().isBlank() ? request.getAudioArtist().trim() : author.getUsername())
                .durationMs(request.getDurationMs() != null ? request.getDurationMs() : 0L)
                .location(request.getLocation() != null ? request.getLocation().trim() : null)
                .hideLikeCount(Boolean.TRUE.equals(request.getHideLikeCount()))
                .commentsDisabled(Boolean.TRUE.equals(request.getCommentsDisabled()))
                .remixOfReel(remixOf)
                .status(ReelStatus.DRAFT)
                .build();

        Reel saved = reelRepository.save(reel);
        log.info("Reel draft {} created by user {}", saved.getId(), author.getUsername());
        return toReelResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReelResponse> getDrafts(Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Page<Reel> page = reelRepository.findDraftReels(currentUserId, pageable);
        return PageResponse.from(page.map(this::toReelResponse));
    }

    @Override
    @Transactional
    public ReelResponse publishDraft(UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId));

        if (!reel.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to publish this reel");
        }

        reel.setStatus(ReelStatus.READY);
        Reel saved = reelRepository.save(reel);
        log.info("Reel draft {} published by user {}", reelId, currentUserId);
        return toReelResponse(saved);
    }

    @Override
    @Transactional
    public void markNotInterested(UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + currentUserId));
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId));

        if (!reelNotInterestedRepository.existsByUserIdAndReelId(currentUserId, reelId)) {
            com.instagramclone.reel.entity.ReelNotInterested record = com.instagramclone.reel.entity.ReelNotInterested.builder()
                    .user(user)
                    .reel(reel)
                    .build();
            reelNotInterestedRepository.save(record);
            log.info("User {} marked reel {} as not interested", currentUserId, reelId);
        }
    }

    @Override
    @Transactional
    public void removeNotInterested(UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        reelNotInterestedRepository.deleteByUserIdAndReelId(currentUserId, reelId);
        log.info("User {} removed not interested mark on reel {}", currentUserId, reelId);
    }

    @Override
    @Transactional
    public ReelResponse unarchiveReel(UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException(ReelConstants.ERR_REEL_NOT_FOUND + reelId));

        if (!reel.getUser().getId().equals(currentUserId) && !SecurityUtils.isCurrentUserAdmin()) {
            throw new ForbiddenException("You are not authorized to unarchive this reel");
        }

        if (reel.isArchived()) {
            reel.unarchive();
            reel = reelRepository.save(reel);
            log.info("Reel {} unarchived by user {}", reelId, currentUserId);
        }
        return toReelResponse(reel);
    }

    @Override
    @Transactional
    public void unsaveReel(UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (reelEngagementService.isSavedByUser(reelId, currentUserId)) {
            reelEngagementService.toggleSave(reelId);
            log.info("Reel {} unsaved by user {}", reelId, currentUserId);
        }
    }

    @Override
    @Transactional
    public com.instagramclone.admin.dto.response.ReportResponse reportReel(
            UUID reelId, com.instagramclone.reel.dto.request.CreateReelReportRequest request) {
        com.instagramclone.admin.dto.request.CreateReportRequest adminReportRequest =
                com.instagramclone.admin.dto.request.CreateReportRequest.builder()
                        .targetType(com.instagramclone.admin.enums.ReportTargetType.REEL)
                        .targetId(reelId)
                        .reasonCode(request.getReasonCode())
                        .description(request.getDescription())
                        .build();
        return adminService.createReport(adminReportRequest);
    }

    private ReelResponse toReelResponse(Reel reel) {
        User u = reel.getUser();
        UUID currentUserId = SecurityUtils.getCurrentUserPrincipal().map(com.instagramclone.security.principal.UserPrincipal::getId).orElse(null);

        long likeCount = reelEngagementService.getLikeCount(reel.getId());
        long commentCount = reelEngagementService.getCommentCount(reel.getId());
        long viewCount = reelEngagementService.getViewCount(reel.getId());
        long shareCount = reelEngagementService.getShareCount(reel.getId());
        boolean liked = currentUserId != null && reelEngagementService.isLikedByUser(reel.getId(), currentUserId);
        boolean saved = currentUserId != null && reelEngagementService.isSavedByUser(reel.getId(), currentUserId);

        Long daysRemaining = null;
        if (Boolean.TRUE.equals(reel.getIsDeleted()) && reel.getDeletedAt() != null) {
            long daysSinceDeletion = ChronoUnit.DAYS.between(reel.getDeletedAt(), LocalDateTime.now());
            int retentionDays = (dynamicDeletionConfigService != null && dynamicDeletionConfigService.getActiveConfig() != null)
                    ? dynamicDeletionConfigService.getActiveConfig().getTrashRetentionDays()
                    : 30;
            daysRemaining = Math.max(0, retentionDays - daysSinceDeletion);
        }

        String effectiveThumbnail = reel.getThumbnailUrl();
        if ((effectiveThumbnail == null || effectiveThumbnail.isBlank()) && reel.getVideoUrl() != null) {
            if (reel.getVideoUrl().contains("cloudinary.com")) {
                effectiveThumbnail = reel.getVideoUrl().replaceFirst("/video/upload/", "/video/upload/so_0,w_720,c_limit,q_auto,f_jpg/").replaceFirst("\\.[^/.]+$", ".jpg");
            } else {
                effectiveThumbnail = reel.getVideoUrl().replaceFirst("\\.[^/.]+$", ".jpg");
            }
        }

        return ReelResponse.builder()
                .id(reel.getId())
                .author(PostAuthorResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .displayName(u.getProfile() != null ? u.getProfile().getDisplayName() : null)
                        .avatarUrl(u.getProfile() != null ? mediaUrlService.maskUrl(u.getProfile().getAvatarUrl()) : null)
                        .build())
                .videoUrl(mediaUrlService.maskUrl(reel.getVideoUrl()))
                .thumbnailUrl(mediaUrlService.maskUrl(effectiveThumbnail))
                .caption(reel.getCaption())
                .audioTitle(reel.getAudioTitle() != null ? reel.getAudioTitle() : "Original Audio")
                .audioArtist(reel.getAudioArtist() != null ? reel.getAudioArtist() : (u != null ? u.getUsername() : "Original Artist"))
                .location(reel.getLocation())
                .isPinned(reel.isPinned())
                .hideLikeCount(reel.isHideLikeCount())
                .commentsDisabled(reel.isCommentsDisabled())
                .isArchived(reel.isArchived())
                .archivedAt(reel.getArchivedAt())
                .savedByCurrentUser(saved)
                .daysRemainingUntilPermanentDelete(daysRemaining)
                .remixReelId(reel.getRemixOfReel() != null ? reel.getRemixOfReel().getId() : null)
                .status(reel.getStatus())
                .durationMs(reel.getDurationMs())
                .likeCount(likeCount)
                .commentCount(commentCount)
                .viewCount(viewCount)
                .shareCount(shareCount)
                .likedByCurrentUser(liked)
                .createdAt(reel.getCreatedAt())
                .updatedAt(reel.getUpdatedAt())
                .build();
    }
}
