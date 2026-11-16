package com.instagramclone.admin.controller;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.dto.request.UpdateUserStatusRequest;
import com.instagramclone.admin.dto.response.AdminUserResponse;
import com.instagramclone.admin.service.interfaces.IAdminUserManagementService;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.enums.UserStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping(AdminConstants.BASE_PATH)
@RequiredArgsConstructor
public class AdminUserController {

    private final IAdminUserManagementService userManagementService;

    @GetMapping(AdminConstants.ADMIN_USERS_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<PageResponse<AdminUserResponse>>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) Role role,
            @PageableDefault(size = AdminConstants.DEFAULT_PAGE_SIZE, sort = AdminConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<AdminUserResponse> users = userManagementService.getUsers(query, status, role, pageable);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_USERS_RETRIEVED, users));
    }

    @PutMapping(AdminConstants.ADMIN_USER_STATUS_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        userManagementService.updateUserStatus(userId, request);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_USER_STATUS_UPDATED, null));
    }

    @DeleteMapping("/admin/users/{userId}")
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID userId) {
        userManagementService.updateUserStatus(userId,
                UpdateUserStatusRequest.builder().status(UserStatus.DELETED).build());
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }
}
