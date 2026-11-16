package com.instagramclone.admin.service.interfaces;

import com.instagramclone.admin.dto.request.UpdateUserStatusRequest;
import com.instagramclone.admin.dto.response.AdminUserResponse;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.enums.UserStatus;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Segregated contract for Admin user listing and status changes.
 */
public interface IAdminUserManagementService {

    void updateUserStatus(UUID userId, UpdateUserStatusRequest request);

    PageResponse<AdminUserResponse> getUsers(String query, UserStatus status, Role role, Pageable pageable);
}

