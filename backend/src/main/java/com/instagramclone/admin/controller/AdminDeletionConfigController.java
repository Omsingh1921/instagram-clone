package com.instagramclone.admin.controller;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.dto.request.UpdateDeletionConfigRequest;
import com.instagramclone.admin.dto.response.DeletionConfigResponse;
import com.instagramclone.admin.service.interfaces.IDynamicDeletionConfigService;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.utility.SecurityUtility;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping(AdminConstants.BASE_PATH)
@RequiredArgsConstructor
public class AdminDeletionConfigController {

    private final IDynamicDeletionConfigService dynamicDeletionConfigService;

    @GetMapping(AdminConstants.ADMIN_DELETION_CONFIG_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<DeletionConfigResponse>> getDeletionConfig() {
        DeletionConfigResponse response = dynamicDeletionConfigService.getConfigResponse();
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_DELETION_CONFIG_RETRIEVED, response));
    }

    @PutMapping(AdminConstants.ADMIN_DELETION_CONFIG_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<DeletionConfigResponse>> updateDeletionConfig(
            @Valid @RequestBody UpdateDeletionConfigRequest request) {
        UUID adminId = SecurityUtility.getCurrentUserId();
        DeletionConfigResponse response = dynamicDeletionConfigService.updateConfig(request, adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_DELETION_CONFIG_UPDATED, response));
    }

    @PostMapping(AdminConstants.ADMIN_DELETION_CONFIG_RESET_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<DeletionConfigResponse>> resetDeletionConfig() {
        UUID adminId = SecurityUtility.getCurrentUserId();
        DeletionConfigResponse response = dynamicDeletionConfigService.resetToDefault(adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_DELETION_CONFIG_UPDATED, response));
    }
}

