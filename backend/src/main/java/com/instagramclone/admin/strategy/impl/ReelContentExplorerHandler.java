package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.dto.response.AdminContentItemResponse;
import com.instagramclone.admin.mapper.AdminMapper;
import com.instagramclone.admin.strategy.AdminContentExplorerHandler;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.repository.ReelCommentRepository;
import com.instagramclone.reel.repository.ReelLikeRepository;
import com.instagramclone.reel.repository.ReelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ReelContentExplorerHandler implements AdminContentExplorerHandler {

    private final ReelRepository reelRepository;
    private final ReelLikeRepository reelLikeRepository;
    private final ReelCommentRepository reelCommentRepository;
    private final AdminMapper adminMapper;
    private final IAuditLogService auditLogService;

    @Override
    public Set<String> supportedTypes() {
        return Set.of("REEL", "REELS");
    }

    @Override
    public PageResponse<AdminContentItemResponse> browse(String cleanQuery, Pageable pageable) {
        Page<Reel> page = reelRepository.findForAdmin(cleanQuery, pageable);
        return PageResponse.from(page.map(reel -> AdminContentItemResponse.builder()
                .id(reel.getId())
                .contentType("REEL")
                .author(adminMapper.toUserSummary(reel.getUser()))
                .caption(reel.getCaption())
                .mediaUrl(adminMapper.maskUrl(reel.getVideoUrl()))
                .thumbnailUrl(adminMapper.maskUrl(reel.getThumbnailUrl()))
                .mediaType("VIDEO")
                .likesCount(reelLikeRepository.countByReelId(reel.getId()))
                .commentsCount(reelCommentRepository.countByReelId(reel.getId()))
                .isArchived(reel.isArchived())
                .isActive(Boolean.TRUE.equals(reel.getIsActive()))
                .createdAt(reel.getCreatedAt())
                .build()));
    }

    @Override
    public void softDelete(UUID contentId, UUID adminId) {
        Reel reel = reelRepository.findById(contentId)
                .filter(r -> !Boolean.TRUE.equals(r.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + contentId));
        reel.softDelete();
        reelRepository.save(reel);
        auditLogService.record(adminId, "ADMIN_DELETE_CONTENT", "REEL", contentId, null, "Removed via Admin Content Explorer");
    }
}

