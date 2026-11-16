package com.instagramclone.post.service.impl;

import com.instagramclone.post.service.interfaces.*;

import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ForbiddenException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.engagement.service.interfaces.IEngagementService;
import com.instagramclone.engagement.repository.SavedPostRepository;
import com.instagramclone.engagement.entity.SavedPost;
import com.instagramclone.media.service.interfaces.IMediaService;
import com.instagramclone.media.service.interfaces.IMediaUrlService;
import com.instagramclone.common.constants.CacheConstants;
import com.instagramclone.utility.RedisUtility;
import com.instagramclone.post.constants.PostConstants;
import com.instagramclone.post.dto.request.CreatePostRequest;
import com.instagramclone.post.dto.response.MediaUploadResponse;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import com.instagramclone.post.dto.request.PostMediaRequest;
import com.instagramclone.post.dto.response.PostMediaResponse;
import com.instagramclone.post.dto.response.PostResponse;
import com.instagramclone.post.dto.request.UpdatePostRequest;
import com.instagramclone.post.enums.MediaType;
import com.instagramclone.post.entity.Post;
import com.instagramclone.post.entity.PostMedia;
import com.instagramclone.post.enums.PostVisibility;
import com.instagramclone.post.repository.PostMediaRepository;
import com.instagramclone.post.repository.PostRepository;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements IPostService {

    private static final Logger log = LoggerFactory.getLogger(PostServiceImpl.class);

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/webp", "image/gif");

    private static final List<String> ALLOWED_VIDEO_TYPES = Arrays.asList(
            "video/mp4", "video/quicktime", "video/webm");

    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final com.instagramclone.post.repository.PostMediaTagRepository postMediaTagRepository;
    private final UserRepository userRepository;
    private final IEngagementService engagementService;
    private final SavedPostRepository savedPostRepository;
    private final com.instagramclone.engagement.repository.LikeRepository likeRepository;
    private final com.instagramclone.reel.repository.SavedReelRepository savedReelRepository;
    private final com.instagramclone.reel.repository.ReelRepository reelRepository;
    @org.springframework.context.annotation.Lazy
    private final com.instagramclone.reel.service.interfaces.IReelEngagementService reelEngagementService;
    private final com.instagramclone.audit.service.interfaces.IAuditLogService auditLogService;
    private final IMediaService mediaService;
    private final IMediaUrlService mediaUrlService;
    private final com.instagramclone.notification.service.interfaces.INotificationService notificationService;
    private final com.instagramclone.common.event.DomainEventPublisher domainEventPublisher;
    private final com.instagramclone.security.service.interfaces.IPrivacyService privacyService;
    private final RedisUtility redisUtility;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    @Transactional
    public PostResponse createPost(CreatePostRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User author = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(PostConstants.ERR_AUTHOR_NOT_FOUND + currentUserId));

        if (author.getRole() == Role.ROLE_ADMIN || "admin".equalsIgnoreCase(author.getUsername())) {
            throw new BadRequestException("Admin accounts cannot create posts");
        }

        if (request.getMedia() == null || request.getMedia().isEmpty()) {
            throw new BadRequestException(PostConstants.ERR_MEDIA_REQUIRED);
        }

        Post post = Post.builder()
                .user(author)
                .caption(request.getCaption())
                .location(request.getLocation() != null ? request.getLocation().trim() : null)
                .commentsDisabled(Boolean.TRUE.equals(request.getCommentsDisabled()))
                .hideLikeCount(Boolean.TRUE.equals(request.getHideLikeCount()))
                .visibility(request.getVisibility() != null ? request.getVisibility() : PostVisibility.PUBLIC)
                .build();

        if (request.getCollaboratorId() != null && !request.getCollaboratorId().equals(currentUserId)) {
            userRepository.findById(request.getCollaboratorId()).ifPresent(collab -> {
                post.setCollaborator(collab);
                post.setCollabStatus(com.instagramclone.post.enums.CollabStatus.PENDING);
            });
        }

        int order = 0;
        for (PostMediaRequest mr : request.getMedia()) {
            PostMedia media = PostMedia.builder()
                    .mediaUrl(mediaUrlService.unmaskUrl(mr.getMediaUrl()))
                    .mediaType(mr.getMediaType() != null ? mr.getMediaType() : MediaType.IMAGE)
                    .displayOrder(mr.getDisplayOrder() != null ? mr.getDisplayOrder() : order++)
                    .width(mr.getWidth())
                    .height(mr.getHeight())
                    .altText(mr.getAltText() != null ? mr.getAltText().trim() : null)
                    .filterName(mr.getFilterName() != null ? mr.getFilterName().trim() : "NORMAL")
                    .build();
            post.addMedia(media);
        }

        Post savedPost = postRepository.save(post);
        log.info("Created post {} by user {}", savedPost.getId(), author.getUsername());

        // Process media user tags if provided
        for (int i = 0; i < request.getMedia().size(); i++) {
            PostMediaRequest mr = request.getMedia().get(i);
            if (mr.getTags() != null && !mr.getTags().isEmpty() && i < savedPost.getMediaList().size()) {
                PostMedia savedMedia = savedPost.getMediaList().get(i);
                for (com.instagramclone.post.dto.request.PostMediaTagRequest tr : mr.getTags()) {
                    if (tr.getTaggedUserId() != null) {
                        userRepository.findById(tr.getTaggedUserId()).ifPresent(taggedUser -> {
                            if (!taggedUser.isDeletedOrDeactivated()) {
                                com.instagramclone.post.entity.PostMediaTag tag = com.instagramclone.post.entity.PostMediaTag
                                        .builder()
                                        .postMedia(savedMedia)
                                        .taggedUser(taggedUser)
                                        .xPercent(tr.getXPercent() != null ? tr.getXPercent() : 50.0)
                                        .yPercent(tr.getYPercent() != null ? tr.getYPercent() : 50.0)
                                        .build();
                                postMediaTagRepository.save(tag);

                                if (!taggedUser.getId().equals(currentUserId)) {
                                    notificationService.createNotification(
                                            taggedUser.getId(),
                                            currentUserId,
                                            com.instagramclone.notification.enums.NotificationType.USER_TAGGED,
                                            savedPost.getId(),
                                            null);
                                }
                            }
                        });
                    }
                }
            }
        }

        // Process root-level tagged users if provided
        if (request.getTaggedUsers() != null && !request.getTaggedUsers().isEmpty()
                && !savedPost.getMediaList().isEmpty()) {
            PostMedia firstMedia = savedPost.getMediaList().get(0);
            for (com.instagramclone.post.dto.request.CreatePostUserTagRequest tagReq : request.getTaggedUsers()) {
                if (tagReq.getUserId() != null) {
                    userRepository.findById(tagReq.getUserId()).ifPresent(taggedUser -> {
                        if (!taggedUser.isDeletedOrDeactivated()) {
                            com.instagramclone.post.entity.PostMediaTag tag = com.instagramclone.post.entity.PostMediaTag
                                    .builder()
                                    .postMedia(firstMedia)
                                    .taggedUser(taggedUser)
                                    .xPercent(tagReq.getXCoord() != null ? tagReq.getXCoord() * 100 : 50.0)
                                    .yPercent(tagReq.getYCoord() != null ? tagReq.getYCoord() * 100 : 50.0)
                                    .build();
                            postMediaTagRepository.save(tag);

                            if (!taggedUser.getId().equals(currentUserId)) {
                                notificationService.createNotification(
                                        taggedUser.getId(),
                                        currentUserId,
                                        com.instagramclone.notification.enums.NotificationType.USER_TAGGED,
                                        savedPost.getId(),
                                        null);
                            }
                        }
                    });
                }
            }
        }

        if (redisUtility != null) {
            redisUtility.deleteAfterCommit(CacheConstants.CACHE_USER_PROFILE_PREFIX + currentUserId);
        }

        return toPostResponse(savedPost, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PostResponse getPostById(UUID postId) {
        UUID currentUserId = SecurityUtils.getCurrentUserPrincipal()
                .map(com.instagramclone.security.principal.UserPrincipal::getId).orElse(null);
        boolean isAdmin = SecurityUtils.isCurrentUserAdmin();

        Optional<Post> postOpt = postRepository.findByIdWithMedia(postId);
        if (postOpt.isEmpty() && isAdmin) {
            postOpt = postRepository.findById(postId);
        }
        if (postOpt.isEmpty()) {
            Optional<com.instagramclone.reel.entity.Reel> reelOpt = reelRepository.findById(postId);
            if (reelOpt.isPresent()) {
                com.instagramclone.reel.entity.Reel reel = reelOpt.get();
                if (!isAdmin) {
                    if (reel.getUser().isDeletedOrDeactivated()) {
                        throw new ResourceNotFoundException(PostConstants.ERR_POST_NOT_FOUND + postId);
                    }
                    privacyService.validateCanViewUserContent(currentUserId, reel.getUser().getId());
                }
                return toPostResponse(reel, currentUserId);
            }
            throw new ResourceNotFoundException(PostConstants.ERR_POST_NOT_FOUND + postId);
        }

        Post post = postOpt.get();

        // When account is deleted or deactivated (or post is deleted), only ADMIN can
        // fetch data!
        if (!isAdmin) {
            if (post.getUser().isDeletedOrDeactivated() || Boolean.TRUE.equals(post.getIsDeleted())) {
                throw new ResourceNotFoundException(PostConstants.ERR_POST_NOT_FOUND + postId);
            }
            privacyService.validateCanViewUserContent(currentUserId, post.getUser().getId());
        }

        return toPostResponse(post, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getSavedPosts(Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Page<SavedPost> savedPostsPage = savedPostRepository.findByUserId(currentUserId, pageable);
        Page<com.instagramclone.reel.entity.SavedReel> savedReelsPage = savedReelRepository.findByUserId(currentUserId,
                pageable);

        List<PostResponse> list = new ArrayList<>();
        savedPostsPage.getContent().forEach(sp -> list.add(toPostResponse(sp.getPost(), currentUserId)));
        savedReelsPage.getContent().forEach(sr -> list.add(toPostResponse(sr.getReel(), currentUserId)));

        list.sort(java.util.Comparator.comparing(PostResponse::getCreatedAt,
                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())));
        int pageSize = pageable.getPageSize();
        List<PostResponse> pagedList = list.size() > pageSize ? list.subList(0, pageSize) : list;
        long totalElements = savedPostsPage.getTotalElements() + savedReelsPage.getTotalElements();

        return PageResponse.from(new org.springframework.data.domain.PageImpl<>(pagedList, pageable, totalElements));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getLikedPosts(Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Page<com.instagramclone.engagement.entity.Like> likesPage = likeRepository.findByUserId(currentUserId,
                pageable);
        List<PostResponse> list = new ArrayList<>();
        likesPage.getContent().forEach(like -> {
            if (like.getPost() != null && !Boolean.TRUE.equals(like.getPost().getIsDeleted())) {
                list.add(toPostResponse(like.getPost(), currentUserId));
            }
        });
        return PageResponse
                .from(new org.springframework.data.domain.PageImpl<>(list, pageable, likesPage.getTotalElements()));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getUserPosts(UUID userId, Pageable pageable) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(PostConstants.ERR_USER_NOT_FOUND + userId));

        UUID currentUserId = SecurityUtils.getCurrentUserPrincipal()
                .map(com.instagramclone.security.principal.UserPrincipal::getId).orElse(null);
        boolean isAdmin = SecurityUtils.isCurrentUserAdmin();

        // When author account is deleted or deactivated, only ADMIN can fetch data!
        if (!isAdmin && author.isDeletedOrDeactivated()) {
            throw new ResourceNotFoundException(PostConstants.ERR_USER_NOT_FOUND + userId);
        }

        if (!isAdmin) {
            privacyService.validateCanViewUserContent(currentUserId, userId);
        }

        Page<Post> posts = isAdmin
                ? postRepository.findByUserId(userId, pageable)
                : postRepository.findByUserIdAndIsDeletedFalse(userId, pageable);
        return PageResponse.from(posts.map(post -> toPostResponse(post, currentUserId)));
    }

    @Override
    @Transactional
    public PostResponse updatePost(UUID postId, UpdatePostRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Post post = postRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new ResourceNotFoundException(PostConstants.ERR_POST_NOT_FOUND + postId));

        if (!post.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException(PostConstants.ERR_UNAUTHORIZED_UPDATE);
        }

        if (request.getCaption() != null) {
            post.setCaption(request.getCaption());
        }
        if (request.getLocation() != null) {
            post.setLocation(request.getLocation().trim().isEmpty() ? null : request.getLocation().trim());
        }
        if (request.getCommentsDisabled() != null) {
            post.setCommentsDisabled(request.getCommentsDisabled());
        }
        if (request.getHideLikeCount() != null) {
            post.setHideLikeCount(request.getHideLikeCount());
        }
        if (request.getVisibility() != null) {
            post.setVisibility(request.getVisibility());
        }

        Post updated = postRepository.save(post);
        log.info("Post {} updated by user {}", postId, currentUserId);

        return toPostResponse(updated, currentUserId);
    }

    @Override
    @Transactional
    public PostResponse togglePinPost(UUID postId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Post post = postRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new ResourceNotFoundException(PostConstants.ERR_POST_NOT_FOUND + postId));

        if (!post.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only pin or unpin your own posts");
        }

        if (!post.isPinned()) {
            long currentPinned = postRepository.countByUserIdAndIsPinnedTrueAndIsDeletedFalse(currentUserId);
            if (currentPinned >= 3) {
                throw new BadRequestException("You can only pin up to 3 posts to your profile");
            }
            post.setPinned(true);
            post.setPinnedAt(java.time.LocalDateTime.now());
        } else {
            post.setPinned(false);
            post.setPinnedAt(null);
        }

        Post saved = postRepository.save(post);
        return toPostResponse(saved, currentUserId);
    }

    @Override
    @Transactional
    public PostResponse toggleComments(UUID postId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Post post = postRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new ResourceNotFoundException(PostConstants.ERR_POST_NOT_FOUND + postId));

        if (!post.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only modify comments settings on your own posts");
        }

        post.setCommentsDisabled(!post.isCommentsDisabled());
        Post saved = postRepository.save(post);
        return toPostResponse(saved, currentUserId);
    }

    @Override
    @Transactional
    public void deletePost(UUID postId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Post post = postRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new ResourceNotFoundException(PostConstants.ERR_POST_NOT_FOUND + postId));

        boolean isAdmin = SecurityUtils.isCurrentUserAdmin();
        if (!post.getUser().getId().equals(currentUserId) && !isAdmin) {
            throw new ForbiddenException(PostConstants.ERR_UNAUTHORIZED_DELETE);
        }

        post.softDelete();
        postRepository.save(post);
        auditLogService.record(currentUserId, "POST_DELETED", "POST", postId, null, "Deleted post");
        log.info("Post {} soft deleted by user {} (admin: {})", postId, currentUserId, isAdmin);

        if (isAdmin && !post.getUser().getId().equals(currentUserId)) {
            try {
                notificationService.createNotification(
                        post.getUser().getId(),
                        currentUserId,
                        com.instagramclone.notification.enums.NotificationType.CONTENT_REMOVED,
                        post.getId(),
                        null,
                        null,
                        null);
            } catch (Exception e) {
                log.warn("Failed to dispatch CONTENT_REMOVED notification for post {}: {}", postId, e.getMessage());
            }
        }
        if (redisUtility != null && post.getUser() != null) {
            redisUtility.deleteAfterCommit(CacheConstants.CACHE_USER_PROFILE_PREFIX + post.getUser().getId());
        }
    }

    @Override
    @Transactional
    public PostResponse toggleArchivePost(UUID postId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Post post = postRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new ResourceNotFoundException(PostConstants.ERR_POST_NOT_FOUND + postId));

        if (!post.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only archive your own posts");
        }

        boolean newArchiveState = !post.isArchived();
        post.setArchived(newArchiveState);
        post.setArchivedAt(newArchiveState ? java.time.LocalDateTime.now() : null);
        Post saved = postRepository.save(post);
        log.info("Post {} archive state toggled to {} by user {}", postId, newArchiveState, currentUserId);
        if (redisUtility != null && post.getUser() != null) {
            redisUtility.deleteAfterCommit(CacheConstants.CACHE_USER_PROFILE_PREFIX + post.getUser().getId());
        }
        return toPostResponse(saved, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getArchivedPosts(Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Page<Post> archivedPage = postRepository.findArchivedPosts(currentUserId, pageable);
        return PageResponse.from(archivedPage.map(p -> toPostResponse(p, currentUserId)));
    }

    @Override
    @Transactional
    public PostResponse toggleHideLikeCount(UUID postId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Post post = postRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new ResourceNotFoundException(PostConstants.ERR_POST_NOT_FOUND + postId));

        if (!post.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only modify like count settings on your own posts");
        }

        post.setHideLikeCount(!post.isHideLikeCount());
        Post saved = postRepository.save(post);
        log.info("Post {} hideLikeCount toggled to {} by user {}", postId, post.isHideLikeCount(), currentUserId);
        return toPostResponse(saved, currentUserId);
    }

    @Override
    @Transactional
    public PostResponse restorePost(UUID postId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException(PostConstants.ERR_POST_NOT_FOUND + postId));

        if (!post.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only restore your own posts");
        }

        if (!Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new BadRequestException("This post is not deleted");
        }

        java.time.LocalDateTime cutoff = java.time.LocalDateTime.now().minusDays(30);
        if (post.getDeletedAt() != null && post.getDeletedAt().isBefore(cutoff)) {
            throw new BadRequestException(
                    "This post has exceeded the 30-day recovery grace period and cannot be restored");
        }

        post.restore();
        Post saved = postRepository.save(post);
        auditLogService.record(currentUserId, "POST_RESTORED", "POST", postId, null,
                "Restored post from recently deleted");
        log.info("Post {} restored by user {}", postId, currentUserId);
        if (redisUtility != null && post.getUser() != null) {
            redisUtility.deleteAfterCommit(CacheConstants.CACHE_USER_PROFILE_PREFIX + post.getUser().getId());
        }
        return toPostResponse(saved, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getRecentlyDeletedPosts(Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        java.time.LocalDateTime cutoff = java.time.LocalDateTime.now().minusDays(30);
        Page<Post> deletedPage = postRepository.findRecentlyDeletedPosts(currentUserId, cutoff, pageable);
        return PageResponse.from(deletedPage.map(p -> toPostResponse(p, currentUserId)));
    }

    @Override
    @Transactional
    public void permanentlyDeletePost(UUID postId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        boolean isAdmin = SecurityUtils.isCurrentUserAdmin();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException(PostConstants.ERR_POST_NOT_FOUND + postId));

        if (!isAdmin && !post.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only permanently delete your own posts");
        }

        postRepository.delete(post);
        auditLogService.record(currentUserId, "POST_PERMANENTLY_PURGED", "POST", postId, null,
                "Permanently purged post");
        log.info("Post {} permanently purged by user {}", postId, currentUserId);
        if (redisUtility != null && post.getUser() != null) {
            redisUtility.deleteAfterCommit(CacheConstants.CACHE_USER_PROFILE_PREFIX + post.getUser().getId());
        }
    }

    @Override
    @Transactional
    public PostResponse respondToCollabInvite(UUID postId, boolean accept) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        if (post.getCollaborator() == null || !post.getCollaborator().getId().equals(currentUserId)) {
            throw new BadRequestException("You are not invited as a collaborator on this post");
        }
        post.setCollabStatus(accept ? com.instagramclone.post.enums.CollabStatus.ACCEPTED
                : com.instagramclone.post.enums.CollabStatus.DECLINED);
        Post saved = postRepository.save(post);
        return toPostResponse(saved, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getPostCount(UUID userId) {
        return postRepository.countByUserId(userId);
    }

    @Override
    public MediaUploadResponse uploadMedia(MultipartFile file) {
        return mediaService.uploadMediaAsUploadResponse(file, "posts");
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getUserTaggedPosts(UUID userId, Pageable pageable) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(PostConstants.ERR_USER_NOT_FOUND + userId));

        UUID currentUserId = SecurityUtils.getCurrentUserPrincipal()
                .map(com.instagramclone.security.principal.UserPrincipal::getId).orElse(null);
        boolean isAdmin = SecurityUtils.isCurrentUserAdmin();

        if (!isAdmin && targetUser.isDeletedOrDeactivated()) {
            throw new ResourceNotFoundException(PostConstants.ERR_USER_NOT_FOUND + userId);
        }

        if (!isAdmin) {
            privacyService.validateCanViewUserContent(currentUserId, userId);
        }

        Page<Post> taggedPosts = postRepository.findTaggedPostsByUserId(userId, pageable);
        return PageResponse.from(taggedPosts.map(post -> toPostResponse(post, currentUserId)));
    }

    private PostResponse toPostResponse(Post post, UUID viewerId) {
        User u = post.getUser();
        List<PostMediaResponse> mediaResponses = new ArrayList<>();
        List<com.instagramclone.post.dto.response.PostUserTagDto> postUserTags = new ArrayList<>();
        if (post.getMediaList() != null && !post.getMediaList().isEmpty()) {
            List<UUID> mediaIds = post.getMediaList().stream()
                    .map(PostMedia::getId)
                    .filter(java.util.Objects::nonNull)
                    .toList();
            java.util.Map<UUID, List<com.instagramclone.post.entity.PostMediaTag>> tagsByMediaId = new java.util.HashMap<>();
            if (!mediaIds.isEmpty()) {
                List<com.instagramclone.post.entity.PostMediaTag> allTags = postMediaTagRepository
                        .findByPostMediaIdIn(mediaIds);
                if (allTags != null) {
                    for (com.instagramclone.post.entity.PostMediaTag mt : allTags) {
                        if (mt.getPostMedia() != null && mt.getPostMedia().getId() != null) {
                            tagsByMediaId.computeIfAbsent(mt.getPostMedia().getId(), k -> new ArrayList<>()).add(mt);
                        }
                    }
                }
            }

            for (PostMedia pm : post.getMediaList()) {
                List<com.instagramclone.post.dto.response.PostMediaTagResponse> tagResponses = new ArrayList<>();
                List<com.instagramclone.post.entity.PostMediaTag> mediaTags = tagsByMediaId.get(pm.getId());
                if (mediaTags != null) {
                    for (com.instagramclone.post.entity.PostMediaTag mt : mediaTags) {
                        User tu = mt.getTaggedUser();
                        if (tu != null) {
                            tagResponses.add(com.instagramclone.post.dto.response.PostMediaTagResponse.builder()
                                    .id(mt.getId())
                                    .taggedUserId(tu.getId())
                                    .taggedUsername(tu.getUsername())
                                    .displayName(tu.getProfile() != null ? tu.getProfile().getDisplayName() : null)
                                    .xPercent(mt.getXPercent())
                                    .yPercent(mt.getYPercent())
                                    .build());
                            postUserTags.add(com.instagramclone.post.dto.response.PostUserTagDto.builder()
                                    .userId(tu.getId())
                                    .username(tu.getUsername())
                                    .xCoord(mt.getXPercent() != null ? mt.getXPercent() / 100.0 : 0.5)
                                    .yCoord(mt.getYPercent() != null ? mt.getYPercent() / 100.0 : 0.5)
                                    .build());
                        }
                    }
                }

                mediaResponses.add(PostMediaResponse.builder()
                        .id(pm.getId())
                        .mediaUrl(mediaUrlService.maskUrl(pm.getMediaUrl()))
                        .mediaType(pm.getMediaType())
                        .displayOrder(pm.getDisplayOrder())
                        .width(pm.getWidth())
                        .height(pm.getHeight())
                        .altText(pm.getAltText())
                        .filterName(pm.getFilterName() != null ? pm.getFilterName() : "NORMAL")
                        .tags(tagResponses)
                        .build());
            }
        }

        long likeCount = engagementService.getLikeCount(post.getId());
        long commentCount = engagementService.getCommentCount(post.getId());
        long shareCount = engagementService.getShareCount(post.getId());
        boolean liked = viewerId != null && engagementService.isLikedByUser(post.getId(), viewerId);
        boolean saved = viewerId != null && engagementService.isSavedByUser(post.getId(), viewerId);

        PostAuthorResponse collabAuthor = null;
        if (post.getCollaborator() != null) {
            User c = post.getCollaborator();
            collabAuthor = PostAuthorResponse.builder()
                    .id(c.getId())
                    .username(c.getUsername())
                    .displayName(c.getProfile() != null ? c.getProfile().getDisplayName() : null)
                    .avatarUrl(c.getProfile() != null ? mediaUrlService.maskUrl(c.getProfile().getAvatarUrl()) : null)
                    .build();
        }

        Long daysRemaining = null;
        if (Boolean.TRUE.equals(post.getIsDeleted()) && post.getDeletedAt() != null) {
            long daysPassed = java.time.temporal.ChronoUnit.DAYS.between(post.getDeletedAt(),
                    java.time.LocalDateTime.now());
            daysRemaining = Math.max(0, 30 - daysPassed);
        }

        return PostResponse.builder()
                .id(post.getId())
                .author(PostAuthorResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .displayName(u.getProfile() != null ? u.getProfile().getDisplayName() : null)
                        .avatarUrl(
                                u.getProfile() != null ? mediaUrlService.maskUrl(u.getProfile().getAvatarUrl()) : null)
                        .build())
                .collaborator(collabAuthor)
                .collabStatus(post.getCollabStatus() != null ? post.getCollabStatus().name() : "NONE")
                .caption(post.getCaption())
                .location(post.getLocation())
                .commentsDisabled(post.isCommentsDisabled())
                .hideLikeCount(post.isHideLikeCount())
                .isPinned(post.isPinned())
                .pinnedAt(post.getPinnedAt())
                .isArchived(post.isArchived())
                .archivedAt(post.getArchivedAt())
                .daysRemainingUntilPermanentDelete(daysRemaining)
                .visibility(post.getVisibility())
                .media(mediaResponses)
                .taggedUsers(postUserTags)
                .likeCount(likeCount)
                .commentCount(commentCount)
                .shareCount(shareCount)
                .likedByCurrentUser(liked)
                .savedByCurrentUser(saved)
                .isReel(false)
                .contentType("POST")
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private PostResponse toPostResponse(com.instagramclone.reel.entity.Reel reel, UUID viewerId) {
        User u = reel.getUser();
        boolean isPrivate = privacyService.isAccountPrivate(u.getId());

        List<PostMediaResponse> mediaResponses = new ArrayList<>();
        mediaResponses.add(PostMediaResponse.builder()
                .id(reel.getId())
                .mediaUrl(mediaUrlService.maskUrl(reel.getVideoUrl()))
                .mediaType(MediaType.VIDEO)
                .displayOrder(0)
                .width(1080)
                .height(1920)
                .build());

        long likeCount = reelEngagementService.getLikeCount(reel.getId());
        long commentCount = reelEngagementService.getCommentCount(reel.getId());
        long shareCount = reelEngagementService.getShareCount(reel.getId());
        boolean liked = viewerId != null && reelEngagementService.isLikedByUser(reel.getId(), viewerId);
        boolean saved = viewerId != null && reelEngagementService.isSavedByUser(reel.getId(), viewerId);

        return PostResponse.builder()
                .id(reel.getId())
                .author(PostAuthorResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .displayName(u.getProfile() != null ? u.getProfile().getDisplayName() : null)
                        .avatarUrl(
                                u.getProfile() != null ? mediaUrlService.maskUrl(u.getProfile().getAvatarUrl()) : null)
                        .build())
                .caption(reel.getCaption())
                .visibility(isPrivate ? PostVisibility.PRIVATE : PostVisibility.PUBLIC)
                .media(mediaResponses)
                .likeCount(likeCount)
                .commentCount(commentCount)
                .shareCount(shareCount)
                .likedByCurrentUser(liked)
                .savedByCurrentUser(saved)
                .isReel(true)
                .contentType("REEL")
                .createdAt(reel.getCreatedAt())
                .updatedAt(reel.getUpdatedAt())
                .build();
    }
}
