package com.instagramclone.admin.controller;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.dto.request.UpdateFeatureFlagRequest;
import com.instagramclone.admin.dto.response.FeatureFlagResponse;
import com.instagramclone.admin.service.interfaces.IDynamicFeatureFlagService;
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
public class AdminFeatureFlagController {

    private final IDynamicFeatureFlagService dynamicFeatureFlagService;

    @GetMapping(AdminConstants.ADMIN_FEATURE_FLAGS_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> getFeatureFlags() {
        FeatureFlagResponse response = dynamicFeatureFlagService.getConfigResponse();
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_FEATURE_FLAGS_RETRIEVED, response));
    }

    @PutMapping(AdminConstants.ADMIN_FEATURE_FLAGS_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> updateFeatureFlags(
            @Valid @RequestBody UpdateFeatureFlagRequest request) {
        UUID adminId = SecurityUtility.getCurrentUserId();
        FeatureFlagResponse response = dynamicFeatureFlagService.updateConfig(request, adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_FEATURE_FLAGS_UPDATED, response));
    }

    @PostMapping(AdminConstants.ADMIN_FEATURE_FLAGS_RESET_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> resetFeatureFlags() {
        UUID adminId = SecurityUtility.getCurrentUserId();
        FeatureFlagResponse response = dynamicFeatureFlagService.resetToDefault(adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_FEATURE_FLAGS_UPDATED, response));
    }

    @GetMapping(AdminConstants.PUBLIC_FEATURE_FLAGS_PATH)
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> getPublicFeatureFlags() {
        FeatureFlagResponse response = dynamicFeatureFlagService.getConfigResponse();
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_FEATURE_FLAGS_RETRIEVED, response));
    }
}

