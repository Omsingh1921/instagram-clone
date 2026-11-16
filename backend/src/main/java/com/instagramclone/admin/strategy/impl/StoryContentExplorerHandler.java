package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.dto.response.AdminContentItemResponse;
import com.instagramclone.admin.mapper.AdminMapper;
import com.instagramclone.admin.strategy.AdminContentExplorerHandler;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.story.entity.Story;
import com.instagramclone.story.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class StoryContentExplorerHandler implements AdminContentExplorerHandler {

    private final StoryRepository storyRepository;
    private final AdminMapper adminMapper;
    private final IAuditLogService auditLogService;

    @Override
    public Set<String> supportedTypes() {
        return Set.of("STORY", "STORIES");
    }

    @Override
    public PageResponse<AdminContentItemResponse> browse(String cleanQuery, Pageable pageable) {
        Page<Story> page = storyRepository.findForAdmin(cleanQuery, pageable);
        LocalDateTime now = LocalDateTime.now();
        return PageResponse.from(page.map(story -> AdminContentItemResponse.builder()
                .id(story.getId())
                .contentType("STORY")
                .author(adminMapper.toUserSummary(story.getUser()))
                .caption(story.getCaption())
                .mediaUrl(adminMapper.maskUrl(story.getMediaUrl()))
                .thumbnailUrl(adminMapper.maskUrl(story.getMediaUrl()))
                .mediaType(story.getMediaType() != null ? story.getMediaType().name() : "IMAGE")
                .likesCount(0L)
                .commentsCount(0L)
                .isArchived(Boolean.TRUE.equals(story.getIsArchived()))
                .isActive(story.getExpiresAt() != null && story.getExpiresAt().isAfter(now))
                .createdAt(story.getCreatedAt())
                .expiresAt(story.getExpiresAt())
                .build()));
    }

    @Override
    public void softDelete(UUID contentId, UUID adminId) {
        Story story = storyRepository.findByIdAndIsDeletedFalse(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Story not found with ID: " + contentId));
        story.softDelete();
        storyRepository.save(story);
        auditLogService.record(adminId, "ADMIN_DELETE_CONTENT", "STORY", contentId, null, "Removed via Admin Content Explorer");
    }
}

