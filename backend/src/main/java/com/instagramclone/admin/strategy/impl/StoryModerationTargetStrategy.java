package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.admin.service.support.UserModerationSupport;
import com.instagramclone.admin.strategy.ModerationTargetStrategy;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.story.entity.Story;
import com.instagramclone.story.repository.StoryRepository;
import com.instagramclone.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class StoryModerationTargetStrategy implements ModerationTargetStrategy {

    private static final Logger log = LoggerFactory.getLogger(StoryModerationTargetStrategy.class);

    private final StoryRepository storyRepository;
    private final IAuditLogService auditLogService;
    private final UserModerationSupport userModerationSupport;

    @Override
    public ReportTargetType getSupportedType() {
        return ReportTargetType.STORY;
    }

    @Override
    public void validateReportable(UUID targetId, UUID currentUserId) {
        Story story = storyRepository.findById(targetId)
                .filter(s -> s.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new ResourceNotFoundException("Story not found with ID: " + targetId));
        if (story.getUser().getId().equals(currentUserId)) {
            throw new BadRequestException(AdminConstants.ERR_CANNOT_REPORT_SELF);
        }
    }

    @Override
    public Optional<UUID> resolveOwnerId(UUID targetId) {
        return storyRepository.findById(targetId).map(s -> s.getUser().getId());
    }

    @Override
    public void executeTakedown(UUID targetId, User reviewer) {
        storyRepository.findById(targetId).ifPresent(story -> {
            story.softDelete();
            story.setExpiresAt(LocalDateTime.now().minusSeconds(1));
            storyRepository.save(story);
            auditLogService.record(reviewer.getId(), "ADMIN_TAKEDOWN_STORY", "STORY", targetId, null, "Story removed by admin moderation");
            log.info("Story {} soft-deleted/removed by admin {}", targetId, reviewer.getUsername());
            userModerationSupport.dispatchContentRemovedNotice(
                    story.getUser().getId(),
                    reviewer.getId(),
                    null,
                    null,
                    story.getMediaUrl()
            );
        });
    }
}

