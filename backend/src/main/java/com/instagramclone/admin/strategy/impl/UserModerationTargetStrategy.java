package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.admin.service.support.UserModerationSupport;
import com.instagramclone.admin.strategy.ModerationTargetStrategy;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserModerationTargetStrategy implements ModerationTargetStrategy {

    private final UserRepository userRepository;
    private final UserModerationSupport userModerationSupport;

    @Override
    public ReportTargetType getSupportedType() {
        return ReportTargetType.USER;
    }

    @Override
    public void validateReportable(UUID targetId, UUID currentUserId) {
        User targetUser = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException(AdminConstants.ERR_USER_NOT_FOUND + targetId));
        if (targetUser.getId().equals(currentUserId)) {
            throw new BadRequestException(AdminConstants.ERR_CANNOT_REPORT_SELF);
        }
    }

    @Override
    public Optional<UUID> resolveOwnerId(UUID targetId) {
        return Optional.ofNullable(targetId);
    }

    @Override
    public void executeTakedown(UUID targetId, User reviewer) {
        userModerationSupport.suspendUserByModeration(
                targetId,
                reviewer,
                "ADMIN_TAKEDOWN_USER",
                "User account suspended by admin moderation"
        );
    }
}

