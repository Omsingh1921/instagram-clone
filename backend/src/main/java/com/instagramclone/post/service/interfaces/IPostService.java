package com.instagramclone.post.service.interfaces;


import java.util.UUID;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.post.dto.request.CreatePostRequest;
import com.instagramclone.post.dto.response.MediaUploadResponse;
import com.instagramclone.post.dto.response.PostResponse;
import com.instagramclone.post.dto.request.UpdatePostRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface IPostService {

    PostResponse createPost(CreatePostRequest request);

    PostResponse getPostById(UUID postId);

    PageResponse<PostResponse> getUserPosts(UUID userId, Pageable pageable);

    PageResponse<PostResponse> getUserTaggedPosts(UUID userId, Pageable pageable);

    PageResponse<PostResponse> getSavedPosts(Pageable pageable);

    PageResponse<PostResponse> getLikedPosts(Pageable pageable);

    PostResponse updatePost(UUID postId, UpdatePostRequest request);

    PostResponse togglePinPost(UUID postId);

    PostResponse toggleComments(UUID postId);

    PostResponse toggleArchivePost(UUID postId);

    PageResponse<PostResponse> getArchivedPosts(Pageable pageable);

    PostResponse toggleHideLikeCount(UUID postId);

    PostResponse restorePost(UUID postId);

    PageResponse<PostResponse> getRecentlyDeletedPosts(Pageable pageable);

    void permanentlyDeletePost(UUID postId);

    PostResponse respondToCollabInvite(UUID postId, boolean accept);

    void deletePost(UUID postId);

    long getPostCount(UUID userId);

    MediaUploadResponse uploadMedia(MultipartFile file);
}
