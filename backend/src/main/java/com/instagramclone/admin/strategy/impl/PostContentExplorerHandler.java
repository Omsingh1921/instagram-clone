package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.dto.response.AdminContentItemResponse;
import com.instagramclone.admin.mapper.AdminMapper;
import com.instagramclone.admin.strategy.AdminContentExplorerHandler;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.engagement.repository.CommentRepository;
import com.instagramclone.engagement.repository.LikeRepository;
import com.instagramclone.post.entity.Post;
import com.instagramclone.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PostContentExplorerHandler implements AdminContentExplorerHandler {

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final AdminMapper adminMapper;
    private final IAuditLogService auditLogService;

    @Override
    public Set<String> supportedTypes() {
        return Set.of("POST", "POSTS");
    }

    @Override
    public PageResponse<AdminContentItemResponse> browse(String cleanQuery, Pageable pageable) {
        Page<Post> page = postRepository.findForAdmin(cleanQuery, pageable);
        return PageResponse.from(page.map(post -> {
            String mediaUrl = (post.getMediaList() != null && !post.getMediaList().isEmpty())
                    ? adminMapper.maskUrl(post.getMediaList().get(0).getMediaUrl())
                    : null;
            String mediaType = (post.getMediaList() != null && !post.getMediaList().isEmpty()
                    && post.getMediaList().get(0).getMediaType() != null)
                    ? post.getMediaList().get(0).getMediaType().name()
                    : "IMAGE";
            return AdminContentItemResponse.builder()
                    .id(post.getId())
                    .contentType("POST")
                    .author(adminMapper.toUserSummary(post.getUser()))
                    .caption(post.getCaption())
                    .mediaUrl(mediaUrl)
                    .thumbnailUrl(mediaUrl)
                    .mediaType(mediaType)
                    .likesCount(likeRepository.countByPostId(post.getId()))
                    .commentsCount(commentRepository.countByPostIdAndIsDeletedFalse(post.getId()))
                    .isArchived(post.isArchived())
                    .isActive(Boolean.TRUE.equals(post.getIsActive()))
                    .createdAt(post.getCreatedAt())
                    .build();
        }));
    }

    @Override
    public void softDelete(UUID contentId, UUID adminId) {
        Post post = postRepository.findByIdAndIsDeletedFalse(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with ID: " + contentId));
        post.softDelete();
        postRepository.save(post);
        auditLogService.record(adminId, "ADMIN_DELETE_CONTENT", "POST", contentId, null, "Removed via Admin Content Explorer");
    }
}

