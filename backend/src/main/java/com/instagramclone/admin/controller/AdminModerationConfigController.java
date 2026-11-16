package com.instagramclone.admin.controller;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.dto.request.UpdateModerationConfigRequest;
import com.instagramclone.admin.dto.response.ModerationConfigResponse;
import com.instagramclone.admin.service.interfaces.IDynamicModerationConfigService;
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
public class AdminModerationConfigController {

    private final IDynamicModerationConfigService dynamicModerationConfigService;

    @GetMapping(AdminConstants.ADMIN_MODERATION_CONFIG_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<ModerationConfigResponse>> getModerationConfig() {
        ModerationConfigResponse response = dynamicModerationConfigService.getConfigResponse();
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_MODERATION_CONFIG_RETRIEVED, response));
    }

    @PutMapping(AdminConstants.ADMIN_MODERATION_CONFIG_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<ModerationConfigResponse>> updateModerationConfig(
            @Valid @RequestBody UpdateModerationConfigRequest request) {
        UUID adminId = SecurityUtility.getCurrentUserId();
        ModerationConfigResponse response = dynamicModerationConfigService.updateConfig(request, adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_MODERATION_CONFIG_UPDATED, response));
    }

    @PostMapping(AdminConstants.ADMIN_MODERATION_CONFIG_RESET_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<ModerationConfigResponse>> resetModerationConfig() {
        UUID adminId = SecurityUtility.getCurrentUserId();
        ModerationConfigResponse response = dynamicModerationConfigService.resetToDefault(adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_MODERATION_CONFIG_UPDATED, response));
    }
}

