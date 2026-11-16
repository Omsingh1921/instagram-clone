package com.instagramclone.admin.service.impl;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.dto.request.UpdateUserStatusRequest;
import com.instagramclone.admin.dto.response.AdminUserResponse;
import com.instagramclone.admin.mapper.AdminMapper;
import com.instagramclone.admin.service.interfaces.IAdminUserManagementService;
import com.instagramclone.admin.service.support.UserModerationSupport;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.follow.repository.FollowRepository;
import com.instagramclone.post.repository.PostRepository;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.enums.UserStatus;
import com.instagramclone.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUserManagementServiceImpl implements IAdminUserManagementService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserManagementServiceImpl.class);

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;
    private final IAuditLogService auditLogService;
    private final UserModerationSupport userModerationSupport;
    private final AdminMapper adminMapper;

    @Override
    @Transactional
    public void updateUserStatus(UUID userId, UpdateUserStatusRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (userId.equals(currentUserId)) {
            throw new BadRequestException(AdminConstants.ERR_CANNOT_MODIFY_OWN_STATUS);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(AdminConstants.ERR_USER_NOT_FOUND + userId));

        if (userModerationSupport.isProtectedAdmin(user) &&
                (request.getStatus() == UserStatus.DELETED || request.getStatus() == UserStatus.SUSPENDED ||
                 request.getStatus() == UserStatus.INACTIVE || request.getStatus() == UserStatus.DEACTIVATED)) {
            throw new BadRequestException("Admin accounts cannot be deactivated, suspended, or deleted");
        }

        UserStatus oldStatus = user.getStatus();
        user.setStatus(request.getStatus());
        if (request.getStatus() == UserStatus.ACTIVE) {
            user.setIsActive(true);
            user.setIsDeleted(false);
            user.setDeletedAt(null);
            if (oldStatus == UserStatus.SUSPENDED) {
                userModerationSupport.clearUserTokenBlacklist(userId);
                userModerationSupport.dispatchUnsuspensionNotice(userId, currentUserId);
            }
        } else if (request.getStatus() == UserStatus.DELETED) {
            user.softDelete();
            userModerationSupport.revokeUserAccess(userId);
        } else {
            user.setIsActive(false);
            if (request.getStatus() == UserStatus.SUSPENDED) {
                userModerationSupport.revokeUserAccess(userId);
                userModerationSupport.dispatchSuspensionNotice(userId, currentUserId);
            }
        }
        userRepository.save(user);

        auditLogService.record(currentUserId, "ADMIN_UPDATE_USER_STATUS", "USER", userId, null,
                "New status: " + request.getStatus());
        log.info("User {} status updated to {} by admin {}", user.getUsername(), request.getStatus(), currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> getUsers(String query, UserStatus status, Role role, Pageable pageable) {
        Page<User> page = userRepository.findUsersForAdmin(query, status, role, pageable);
        return PageResponse.from(page.map(user -> adminMapper.toAdminUserResponse(
                user,
                postRepository.countByUserIdAndIsDeletedFalse(user.getId()),
                followRepository.countByFollowingId(user.getId()),
                followRepository.countByFollowerId(user.getId())
        )));
    }
}

