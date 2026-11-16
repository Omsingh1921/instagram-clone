package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.admin.service.support.UserModerationSupport;
import com.instagramclone.admin.strategy.ModerationTargetStrategy;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.repository.ReelRepository;
import com.instagramclone.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ReelModerationTargetStrategy implements ModerationTargetStrategy {

    private static final Logger log = LoggerFactory.getLogger(ReelModerationTargetStrategy.class);

    private final ReelRepository reelRepository;
    private final IAuditLogService auditLogService;
    private final UserModerationSupport userModerationSupport;

    @Override
    public ReportTargetType getSupportedType() {
        return ReportTargetType.REEL;
    }

    @Override
    public void validateReportable(UUID targetId, UUID currentUserId) {
        Reel reel = reelRepository.findById(targetId)
                .filter(r -> !Boolean.TRUE.equals(r.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + targetId));
        if (reel.getUser().getId().equals(currentUserId)) {
            throw new BadRequestException(AdminConstants.ERR_CANNOT_REPORT_SELF);
        }
    }

    @Override
    public Optional<UUID> resolveOwnerId(UUID targetId) {
        return reelRepository.findById(targetId).map(r -> r.getUser().getId());
    }

    @Override
    public void executeTakedown(UUID targetId, User reviewer) {
        reelRepository.findById(targetId).ifPresent(reel -> {
            reel.softDelete();
            reelRepository.save(reel);
            auditLogService.record(reviewer.getId(), "ADMIN_TAKEDOWN_REEL", "REEL", targetId, null, "Reel removed by admin moderation");
            log.info("Reel {} soft-deleted by admin {}", targetId, reviewer.getUsername());
            userModerationSupport.dispatchContentRemovedNotice(
                    reel.getUser().getId(),
                    reviewer.getId(),
                    null,
                    reel.getId(),
                    reel.getThumbnailUrl()
            );
        });
    }
}

