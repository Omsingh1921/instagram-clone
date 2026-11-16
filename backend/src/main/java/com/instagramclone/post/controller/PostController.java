package com.instagramclone.post.controller;

import com.instagramclone.post.constants.PostConstants;
import com.instagramclone.ratelimit.RateLimit;
import java.util.UUID;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.post.dto.request.CreatePostRequest;
import com.instagramclone.post.dto.response.PostResponse;
import com.instagramclone.post.dto.request.UpdatePostRequest;
import com.instagramclone.post.service.interfaces.IPostService;
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

@RestController
@RequestMapping({PostConstants.BASE_PATH + PostConstants.POSTS_PATH, PostConstants.BASE_PATH})
@RequiredArgsConstructor
public class PostController {

    private final IPostService postService;

    @PreAuthorize("hasRole('USER')")
    @RateLimit(category = PostConstants.RATE_LIMIT_CONTENT_CREATE, limit = 15, windowSeconds = 60)
    @PostMapping({"", PostConstants.POSTS_PATH})
    public ResponseEntity<ApiResponse<PostResponse>> createPost(@Valid @RequestBody CreatePostRequest request) {
        PostResponse response = postService.createPost(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(PostConstants.MSG_POST_CREATED, response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping({"/saved", PostConstants.SAVED_POSTS_PATH})
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getSavedPosts(
            @PageableDefault(size = PostConstants.DEFAULT_PAGE_SIZE, sort = PostConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<PostResponse> savedPosts = postService.getSavedPosts(pageable);
        return ResponseEntity.ok(ApiResponse.success(PostConstants.MSG_SAVED_POSTS_RETRIEVED, savedPosts));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/liked")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getLikedPosts(
            @PageableDefault(size = PostConstants.DEFAULT_PAGE_SIZE, sort = PostConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<PostResponse> likedPosts = postService.getLikedPosts(pageable);
        return ResponseEntity.ok(ApiResponse.success("Liked posts retrieved", likedPosts));
    }

    @GetMapping({"/{postId}", PostConstants.POST_BY_ID_PATH})
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PostResponse>> getPostById(@PathVariable UUID postId) {
        PostResponse response = postService.getPostById(postId);
        return ResponseEntity.ok(ApiResponse.success(PostConstants.MSG_POST_RETRIEVED, response));
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping({PostConstants.USER_POSTS_PATH, "/users/{userId}/posts", "/posts/users/{userId}/posts"})
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getUserPosts(
            @PathVariable UUID userId,
            @PageableDefault(size = PostConstants.DEFAULT_PAGE_SIZE, sort = PostConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<PostResponse> posts = postService.getUserPosts(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PostConstants.MSG_USER_POSTS_RETRIEVED, posts));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping({PostConstants.USER_TAGGED_POSTS_PATH, "/users/{userId}/posts/tagged", "/users/{userId}/tagged-posts"})
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getUserTaggedPosts(
            @PathVariable UUID userId,
            @PageableDefault(size = PostConstants.DEFAULT_PAGE_SIZE, sort = PostConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<PostResponse> posts = postService.getUserTaggedPosts(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PostConstants.MSG_USER_TAGGED_POSTS_RETRIEVED, posts));
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping({"/{postId}", PostConstants.POST_BY_ID_PATH})
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable UUID postId,
            @Valid @RequestBody UpdatePostRequest request) {
        PostResponse response = postService.updatePost(postId, request);
        return ResponseEntity.ok(ApiResponse.success(PostConstants.MSG_POST_UPDATED, response));
    }

    @DeleteMapping({"/{postId}", PostConstants.POST_BY_ID_PATH})
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable UUID postId) {
        postService.deletePost(postId);
        return ResponseEntity.ok(ApiResponse.success(PostConstants.MSG_POST_DELETED, null));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping({"/{postId}/pin", PostConstants.POST_PIN_PATH})
    public ResponseEntity<ApiResponse<PostResponse>> togglePinPost(@PathVariable UUID postId) {
        PostResponse response = postService.togglePinPost(postId);
        return ResponseEntity.ok(ApiResponse.success(
                Boolean.TRUE.equals(response.getIsPinned()) ? "Post pinned to your profile"
                        : "Post unpinned from your profile",
                response));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping({"/{postId}/toggle-comments", PostConstants.POST_COMMENTS_TOGGLE_PATH})
    public ResponseEntity<ApiResponse<PostResponse>> toggleComments(@PathVariable UUID postId) {
        PostResponse response = postService.toggleComments(postId);
        return ResponseEntity.ok(ApiResponse.success(
                Boolean.TRUE.equals(response.getCommentsDisabled()) ? "Commenting has been turned off"
                        : "Commenting has been turned on",
                response));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{postId}/archive")
    public ResponseEntity<ApiResponse<PostResponse>> toggleArchivePost(@PathVariable UUID postId) {
        PostResponse response = postService.toggleArchivePost(postId);
        return ResponseEntity.ok(ApiResponse.success(
                Boolean.TRUE.equals(response.getIsArchived()) ? "Post archived"
                        : "Post unarchived and visible on your profile",
                response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/archived")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getArchivedPosts(
            @PageableDefault(size = PostConstants.DEFAULT_PAGE_SIZE, sort = PostConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<PostResponse> archivedPosts = postService.getArchivedPosts(pageable);
        return ResponseEntity.ok(ApiResponse.success("Archived posts retrieved", archivedPosts));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{postId}/hide-likes")
    public ResponseEntity<ApiResponse<PostResponse>> toggleHideLikeCount(@PathVariable UUID postId) {
        PostResponse response = postService.toggleHideLikeCount(postId);
        return ResponseEntity.ok(ApiResponse.success(
                Boolean.TRUE.equals(response.getHideLikeCount()) ? "Like and view counts hidden on this post"
                        : "Like and view counts visible on this post",
                response));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{postId}/restore")
    public ResponseEntity<ApiResponse<PostResponse>> restorePost(@PathVariable UUID postId) {
        PostResponse response = postService.restorePost(postId);
        return ResponseEntity.ok(ApiResponse.success("Post restored successfully to your profile", response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/recently-deleted")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getRecentlyDeletedPosts(
            @PageableDefault(size = PostConstants.DEFAULT_PAGE_SIZE, sort = "deletedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<PostResponse> deletedPosts = postService.getRecentlyDeletedPosts(pageable);
        return ResponseEntity.ok(ApiResponse.success("Recently deleted posts retrieved", deletedPosts));
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @DeleteMapping("/{postId}/permanent")
    public ResponseEntity<ApiResponse<Void>> permanentlyDeletePost(@PathVariable UUID postId) {
        postService.permanentlyDeletePost(postId);
        return ResponseEntity.ok(ApiResponse.success("Post permanently deleted", null));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{postId}/collab-response")
    public ResponseEntity<ApiResponse<PostResponse>> respondToCollabInvite(
            @PathVariable UUID postId,
            @org.springframework.web.bind.annotation.RequestParam boolean accept) {
        PostResponse response = postService.respondToCollabInvite(postId, accept);
        return ResponseEntity.ok(ApiResponse.success(
                accept ? "Collaboration invitation accepted" : "Collaboration invitation declined",
                response));
    }
}
