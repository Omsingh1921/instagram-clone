package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.admin.strategy.ModerationTargetStrategy;
import com.instagramclone.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class ProblemModerationTargetStrategy implements ModerationTargetStrategy {

    private static final Logger log = LoggerFactory.getLogger(ProblemModerationTargetStrategy.class);

    @Override
    public ReportTargetType getSupportedType() {
        return ReportTargetType.PROBLEM;
    }

    @Override
    public void validateReportable(UUID targetId, UUID currentUserId) {
        // Platform bug, feedback or problem report: no self-reporting restriction or entity lookup
    }

    @Override
    public Optional<UUID> resolveOwnerId(UUID targetId) {
        return Optional.empty();
    }

    @Override
    public void executeTakedown(UUID targetId, User reviewer) {
        log.info("Problem report target ID {} acknowledged by admin {}", targetId, reviewer.getUsername());
    }
}

