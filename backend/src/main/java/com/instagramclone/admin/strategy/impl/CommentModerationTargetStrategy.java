package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.admin.strategy.ModerationTargetStrategy;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.engagement.entity.Comment;
import com.instagramclone.engagement.repository.CommentRepository;
import com.instagramclone.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CommentModerationTargetStrategy implements ModerationTargetStrategy {

    private static final Logger log = LoggerFactory.getLogger(CommentModerationTargetStrategy.class);

    private final CommentRepository commentRepository;
    private final IAuditLogService auditLogService;

    @Override
    public ReportTargetType getSupportedType() {
        return ReportTargetType.COMMENT;
    }

    @Override
    public void validateReportable(UUID targetId, UUID currentUserId) {
        Comment comment = commentRepository.findByIdAndIsDeletedFalse(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with ID: " + targetId));
        if (comment.getUser().getId().equals(currentUserId)) {
            throw new BadRequestException(AdminConstants.ERR_CANNOT_REPORT_SELF);
        }
    }

    @Override
    public Optional<UUID> resolveOwnerId(UUID targetId) {
        return commentRepository.findById(targetId).map(c -> c.getUser().getId());
    }

    @Override
    public void executeTakedown(UUID targetId, User reviewer) {
        commentRepository.findById(targetId).ifPresent(comment -> {
            comment.softDelete();
            commentRepository.save(comment);
            auditLogService.record(reviewer.getId(), "ADMIN_TAKEDOWN_COMMENT", "COMMENT", targetId, null, "Comment removed by admin moderation");
            log.info("Comment {} soft-deleted by admin {}", targetId, reviewer.getUsername());
        });
    }
}

