package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.admin.service.support.UserModerationSupport;
import com.instagramclone.admin.strategy.ModerationTargetStrategy;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.post.entity.Post;
import com.instagramclone.post.repository.PostRepository;
import com.instagramclone.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PostModerationTargetStrategy implements ModerationTargetStrategy {

    private static final Logger log = LoggerFactory.getLogger(PostModerationTargetStrategy.class);

    private final PostRepository postRepository;
    private final IAuditLogService auditLogService;
    private final UserModerationSupport userModerationSupport;

    @Override
    public ReportTargetType getSupportedType() {
        return ReportTargetType.POST;
    }

    @Override
    public void validateReportable(UUID targetId, UUID currentUserId) {
        Post post = postRepository.findByIdAndIsDeletedFalse(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with ID: " + targetId));
        if (post.getUser().getId().equals(currentUserId)) {
            throw new BadRequestException(AdminConstants.ERR_CANNOT_REPORT_SELF);
        }
    }

    @Override
    public Optional<UUID> resolveOwnerId(UUID targetId) {
        return postRepository.findById(targetId).map(p -> p.getUser().getId());
    }

    @Override
    public void executeTakedown(UUID targetId, User reviewer) {
        postRepository.findById(targetId).ifPresent(post -> {
            post.softDelete();
            postRepository.save(post);
            auditLogService.record(reviewer.getId(), "ADMIN_TAKEDOWN_POST", "POST", targetId, null, "Post removed by admin moderation");
            log.info("Post {} soft-deleted by admin {}", targetId, reviewer.getUsername());
            userModerationSupport.dispatchContentRemovedNotice(
                    post.getUser().getId(),
                    reviewer.getId(),
                    post.getId(),
                    null,
                    null
            );
        });
    }
}

