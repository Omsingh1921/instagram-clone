package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.admin.strategy.ModerationTargetStrategy;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.chat.entity.Message;
import com.instagramclone.chat.repository.MessageRepository;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MessageModerationTargetStrategy implements ModerationTargetStrategy {

    private static final Logger log = LoggerFactory.getLogger(MessageModerationTargetStrategy.class);

    private final MessageRepository messageRepository;
    private final IAuditLogService auditLogService;

    @Override
    public ReportTargetType getSupportedType() {
        return ReportTargetType.MESSAGE;
    }

    @Override
    public void validateReportable(UUID targetId, UUID currentUserId) {
        Message message = messageRepository.findById(targetId)
                .filter(m -> !Boolean.TRUE.equals(m.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with ID: " + targetId));
        if (message.getSender().getId().equals(currentUserId)) {
            throw new BadRequestException(AdminConstants.ERR_CANNOT_REPORT_SELF);
        }
    }

    @Override
    public Optional<UUID> resolveOwnerId(UUID targetId) {
        return messageRepository.findById(targetId).map(m -> m.getSender().getId());
    }

    @Override
    public void executeTakedown(UUID targetId, User reviewer) {
        messageRepository.findById(targetId).ifPresent(msg -> {
            msg.softDelete();
            messageRepository.save(msg);
            auditLogService.record(reviewer.getId(), "ADMIN_TAKEDOWN_MESSAGE", "MESSAGE", targetId, null, "Message removed by admin moderation");
            log.info("Message {} soft-deleted by admin {}", targetId, reviewer.getUsername());
        });
    }
}

