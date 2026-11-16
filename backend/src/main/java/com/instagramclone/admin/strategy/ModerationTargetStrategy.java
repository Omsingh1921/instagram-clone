package com.instagramclone.admin.strategy;

import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.user.entity.User;

import java.util.Optional;
import java.util.UUID;

/**
 * OCP/DIP strategy contract encapsulating validation, owner resolution, and takedown execution
 * for a single {@link ReportTargetType}. Adding a new reportable target type only requires adding
 * a new implementation bean.
 */
public interface ModerationTargetStrategy {

    ReportTargetType getSupportedType();

    void validateReportable(UUID targetId, UUID currentUserId);

    Optional<UUID> resolveOwnerId(UUID targetId);

    void executeTakedown(UUID targetId, User reviewer);
}

