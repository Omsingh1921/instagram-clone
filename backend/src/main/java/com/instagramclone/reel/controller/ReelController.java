package com.instagramclone.reel.controller;

import com.instagramclone.follow.dto.response.FollowUserResponse;
import com.instagramclone.ratelimit.RateLimit;
import com.instagramclone.reel.constants.ReelConstants;
import java.util.UUID;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.reel.dto.request.CreateReelRequest;
import com.instagramclone.reel.dto.response.ReelResponse;
import com.instagramclone.reel.service.interfaces.IReelService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;
import com.instagramclone.reel.dto.request.UpdateReelRequest;

@RestController
@RequestMapping(ReelConstants.BASE_PATH)
@RequiredArgsConstructor
public class ReelController {

    private final IReelService reelService;
    private final com.instagramclone.reel.service.interfaces.IReelEngagementService reelEngagementService;

    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = ReelConstants.RATE_LIMIT_CONTENT_CREATE, limit = 10, windowSeconds = 60)
    @PostMapping(ReelConstants.REELS_PATH)
    public ResponseEntity<ApiResponse<ReelResponse>> createReel(@Valid @RequestBody CreateReelRequest request) {
        ReelResponse response = reelService.createReel(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ReelConstants.MSG_REEL_CREATED, response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping(ReelConstants.REELS_PATH)
    public ResponseEntity<ApiResponse<PageResponse<ReelResponse>>> getReels(
            @PageableDefault(size = ReelConstants.DEFAULT_PAGE_SIZE, sort = ReelConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(name = ReelConstants.PARAM_SEED, required = false) Long seed) {
        PageResponse<ReelResponse> response = reelService.getReels(pageable, seed);
        return ResponseEntity.ok(ApiResponse.success(ReelConstants.MSG_REELS_RETRIEVED, response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/reels/audio")
    public ResponseEntity<ApiResponse<PageResponse<ReelResponse>>> getReelsByAudio(
            @org.springframework.web.bind.annotation.RequestParam("title") String title,
            @PageableDefault(size = ReelConstants.DEFAULT_PAGE_SIZE, sort = ReelConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ReelResponse> response = reelService.getReelsByAudio(title, pageable);
        return ResponseEntity.ok(ApiResponse.success("Audio reels retrieved successfully", response));
    }

    @GetMapping(ReelConstants.REEL_BY_ID_PATH)
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ReelResponse>> getReelById(@PathVariable UUID reelId) {
        ReelResponse response = reelService.getReelById(reelId);
        return ResponseEntity.ok(ApiResponse.success(ReelConstants.MSG_REEL_RETRIEVED, response));
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping(ReelConstants.USER_REELS_PATH)
    public ResponseEntity<ApiResponse<PageResponse<ReelResponse>>> getUserReels(
            @PathVariable UUID userId,
            @PageableDefault(size = ReelConstants.DEFAULT_USER_REELS_PAGE_SIZE, sort = ReelConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ReelResponse> response = reelService.getUserReels(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(ReelConstants.MSG_USER_REELS_RETRIEVED, response));
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping(ReelConstants.REEL_BY_ID_PATH)
    public ResponseEntity<ApiResponse<ReelResponse>> updateReel(
            @PathVariable UUID reelId,
            @Valid @RequestBody UpdateReelRequest request) {
        ReelResponse response = reelService.updateReel(reelId, request);
        return ResponseEntity.ok(ApiResponse.success("Reel updated successfully", response));
    }

    @DeleteMapping(ReelConstants.REEL_BY_ID_PATH)
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteReel(@PathVariable UUID reelId) {
        reelService.deleteReel(reelId);
        return ResponseEntity.ok(ApiResponse.success(ReelConstants.MSG_REEL_DELETED, null));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/reels/{reelId}/restore")
    public ResponseEntity<ApiResponse<ReelResponse>> restoreReel(@PathVariable UUID reelId) {
        ReelResponse response = reelService.restoreReel(reelId);
        return ResponseEntity.ok(ApiResponse.success("Reel restored successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/reels/recently-deleted")
    public ResponseEntity<ApiResponse<PageResponse<ReelResponse>>> getRecentlyDeletedReels(
            @PageableDefault(size = ReelConstants.DEFAULT_PAGE_SIZE, sort = ReelConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ReelResponse> response = reelService.getRecentlyDeletedReels(pageable);
        return ResponseEntity.ok(ApiResponse.success("Recently deleted reels retrieved successfully", response));
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @DeleteMapping("/reels/{reelId}/permanent")
    public ResponseEntity<ApiResponse<Void>> permanentlyDeleteReel(@PathVariable UUID reelId) {
        reelService.permanentlyDeleteReel(reelId);
        return ResponseEntity.ok(ApiResponse.success("Reel permanently deleted", null));
    }

    @PutMapping("/reels/{reelId}/archive")
    public ResponseEntity<ApiResponse<ReelResponse>> toggleArchiveReel(@PathVariable UUID reelId) {
        ReelResponse response = reelService.toggleArchiveReel(reelId);
        return ResponseEntity.ok(ApiResponse.success(
                response.isArchived() ? "Reel archived successfully" : "Reel unarchived successfully",
                response));
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/reels/{reelId}/archive")
    public ResponseEntity<ApiResponse<ReelResponse>> unarchiveReel(@PathVariable UUID reelId) {
        ReelResponse response = reelService.unarchiveReel(reelId);
        return ResponseEntity.ok(ApiResponse.success("Reel unarchived successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping({ "/reels/archived", "/users/me/archived-reels" })
    public ResponseEntity<ApiResponse<PageResponse<ReelResponse>>> getArchivedReels(
            @PageableDefault(size = ReelConstants.DEFAULT_PAGE_SIZE, sort = ReelConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ReelResponse> response = reelService.getArchivedReels(pageable);
        return ResponseEntity.ok(ApiResponse.success("Archived reels retrieved successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping({ "/reels/{reelId}/save", "/reels/{reelId}/bookmark" })
    // @PutMapping("/reels/{reelId}/save")
    public ResponseEntity<ApiResponse<com.instagramclone.engagement.dto.response.SavePostResponse>> toggleSave(
            @PathVariable UUID reelId) {
        com.instagramclone.engagement.dto.response.SavePostResponse response = reelEngagementService.toggleSave(reelId);
        return ResponseEntity.ok(ApiResponse.success(
                response.isSaved() ? "Reel saved successfully" : "Reel removed from saved",
                response));
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping({ "/reels/{reelId}/save", "/reels/{reelId}/bookmark" })
    public ResponseEntity<ApiResponse<Void>> unsaveReel(@PathVariable UUID reelId) {
        reelService.unsaveReel(reelId);
        return ResponseEntity.ok(ApiResponse.success("Reel removed from saved", null));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping({ "/reels/saved", "/users/me/saved-reels" })
    public ResponseEntity<ApiResponse<PageResponse<ReelResponse>>> getSavedReels(
            @PageableDefault(size = ReelConstants.DEFAULT_PAGE_SIZE, sort = ReelConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ReelResponse> response = reelService.getSavedReels(pageable);
        return ResponseEntity.ok(ApiResponse.success("Saved reels retrieved successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/reels/{reelId}/reports")
    public ResponseEntity<ApiResponse<com.instagramclone.admin.dto.response.ReportResponse>> reportReel(
            @PathVariable UUID reelId,
            @Valid @RequestBody com.instagramclone.reel.dto.request.CreateReelReportRequest request) {
        com.instagramclone.admin.dto.response.ReportResponse response = reelService.reportReel(reelId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Report submitted successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/reels/{reelId}/pin")
    public ResponseEntity<ApiResponse<ReelResponse>> togglePinReel(@PathVariable UUID reelId) {
        ReelResponse response = reelService.togglePinReel(reelId);
        return ResponseEntity.ok(ApiResponse.success(
                response.isPinned() ? "Reel pinned to profile" : "Reel unpinned from profile",
                response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/reels/following")
    public ResponseEntity<ApiResponse<PageResponse<ReelResponse>>> getFollowingReels(
            @PageableDefault(size = ReelConstants.DEFAULT_PAGE_SIZE, sort = ReelConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(name = ReelConstants.PARAM_SEED, required = false) Long seed) {
        PageResponse<ReelResponse> response = reelService.getFollowingReels(pageable, seed);
        return ResponseEntity.ok(ApiResponse.success("Following reels retrieved successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/reels/hashtag/{hashtag}")
    public ResponseEntity<ApiResponse<PageResponse<ReelResponse>>> getReelsByHashtag(
            @PathVariable String hashtag,
            @PageableDefault(size = ReelConstants.DEFAULT_PAGE_SIZE, sort = ReelConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ReelResponse> response = reelService.getReelsByHashtag(hashtag, pageable);
        return ResponseEntity.ok(ApiResponse.success("Hashtag reels retrieved successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = ReelConstants.RATE_LIMIT_CONTENT_ENGAGEMENT, limit = 60, windowSeconds = 60)
    @PostMapping({ ReelConstants.REEL_LIKE_PATH, ReelConstants.REEL_LIKES_PATH })
    public ResponseEntity<ApiResponse<com.instagramclone.reel.dto.response.ReelLikeResponse>> toggleLike(
            @PathVariable UUID reelId) {
        com.instagramclone.reel.dto.response.ReelLikeResponse response = reelEngagementService.toggleLike(reelId);
        return ResponseEntity.ok(ApiResponse.success(
                response.isLiked() ? ReelConstants.MSG_REEL_LIKED : ReelConstants.MSG_REEL_UNLIKED,
                response));
    }

    @GetMapping(ReelConstants.REEL_LIKES_PATH)
    public ResponseEntity<ApiResponse<PageResponse<FollowUserResponse>>> getReelLikes(
            @PathVariable UUID reelId,
            @PageableDefault(size = ReelConstants.DEFAULT_PAGE_SIZE, sort = ReelConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<FollowUserResponse> response = reelEngagementService.getReelLikes(reelId, pageable);
        return ResponseEntity.ok(ApiResponse.success(ReelConstants.MSG_REEL_LIKES_RETRIEVED, response));
    }

    @RateLimit(category = ReelConstants.RATE_LIMIT_CONTENT_COMMENT, limit = 20, windowSeconds = 60)
    @PostMapping(ReelConstants.REEL_COMMENTS_PATH)
    public ResponseEntity<ApiResponse<com.instagramclone.reel.dto.response.ReelCommentResponse>> addComment(
            @PathVariable UUID reelId,
            @Valid @RequestBody com.instagramclone.reel.dto.request.CreateReelCommentRequest request) {
        com.instagramclone.reel.dto.response.ReelCommentResponse response = reelEngagementService.addComment(reelId,
                request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ReelConstants.MSG_COMMENT_ADDED, response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping(ReelConstants.REEL_COMMENTS_PATH)
    public ResponseEntity<ApiResponse<PageResponse<com.instagramclone.reel.dto.response.ReelCommentResponse>>> getComments(
            @PathVariable UUID reelId,
            @PageableDefault(size = ReelConstants.DEFAULT_COMMENTS_PAGE_SIZE, sort = ReelConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.ASC) Pageable pageable) {
        PageResponse<com.instagramclone.reel.dto.response.ReelCommentResponse> comments = reelEngagementService
                .getComments(reelId, pageable);
        return ResponseEntity.ok(ApiResponse.success(ReelConstants.MSG_COMMENTS_RETRIEVED, comments));
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping({ ReelConstants.REEL_COMMENT_BY_ID_PATH, ReelConstants.REEL_COMMENT_WITH_REEL_ID_PATH })
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable UUID commentId) {
        reelEngagementService.deleteComment(commentId);
        return ResponseEntity.ok(ApiResponse.success(ReelConstants.MSG_COMMENT_DELETED, null));
    }

    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = ReelConstants.RATE_LIMIT_CONTENT_ENGAGEMENT, limit = 60, windowSeconds = 60)
    @PostMapping({ ReelConstants.REEL_VIEW_PATH, ReelConstants.REEL_VIEWS_PATH })
    public ResponseEntity<ApiResponse<com.instagramclone.reel.dto.response.ReelViewResponse>> recordView(
            @PathVariable UUID reelId) {
        com.instagramclone.reel.dto.response.ReelViewResponse response = reelEngagementService.recordView(reelId);
        return ResponseEntity.ok(ApiResponse.success(ReelConstants.MSG_VIEW_RECORDED, response));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{reelId}/share")
    public ResponseEntity<ApiResponse<com.instagramclone.engagement.dto.response.ShareResponse>> recordShare(
            @PathVariable UUID reelId,
            @RequestBody(required = false) com.instagramclone.engagement.dto.request.ShareRequest request) {
        com.instagramclone.engagement.dto.response.ShareResponse response = reelEngagementService.recordShare(reelId,
                request);
        return ResponseEntity.ok(ApiResponse.success("Reel shared successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = ReelConstants.RATE_LIMIT_CONTENT_CREATE, limit = 10, windowSeconds = 60)
    @PostMapping("/reels/drafts")
    public ResponseEntity<ApiResponse<ReelResponse>> createDraft(@Valid @RequestBody CreateReelRequest request) {
        ReelResponse response = reelService.createDraft(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reel draft saved successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/reels/drafts")
    public ResponseEntity<ApiResponse<PageResponse<ReelResponse>>> getDrafts(
            @PageableDefault(size = ReelConstants.DEFAULT_PAGE_SIZE, sort = ReelConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ReelResponse> response = reelService.getDrafts(pageable);
        return ResponseEntity.ok(ApiResponse.success("Reel drafts retrieved successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/reels/{reelId}/publish")
    public ResponseEntity<ApiResponse<ReelResponse>> publishDraft(@PathVariable UUID reelId) {
        ReelResponse response = reelService.publishDraft(reelId);
        return ResponseEntity.ok(ApiResponse.success("Reel published successfully", response));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/reels/{reelId}/not-interested")
    public ResponseEntity<ApiResponse<Void>> markNotInterested(@PathVariable UUID reelId) {
        reelService.markNotInterested(reelId);
        return ResponseEntity.ok(ApiResponse.success("Reel marked as not interested", null));
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/reels/{reelId}/not-interested")
    public ResponseEntity<ApiResponse<Void>> removeNotInterested(@PathVariable UUID reelId) {
        reelService.removeNotInterested(reelId);
        return ResponseEntity.ok(ApiResponse.success("Reel not interested mark removed", null));
    }
}
