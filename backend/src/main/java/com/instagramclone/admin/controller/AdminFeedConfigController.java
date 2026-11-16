package com.instagramclone.admin.controller;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.dto.request.UpdateFeedConfigRequest;
import com.instagramclone.admin.dto.response.FeedConfigResponse;
import com.instagramclone.admin.service.interfaces.IDynamicFeedConfigService;
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
public class AdminFeedConfigController {

    private final IDynamicFeedConfigService dynamicFeedConfigService;

    @GetMapping(AdminConstants.ADMIN_FEED_CONFIG_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<FeedConfigResponse>> getFeedConfig() {
        FeedConfigResponse response = dynamicFeedConfigService.getConfigResponse();
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_FEED_CONFIG_RETRIEVED, response));
    }

    @PutMapping(AdminConstants.ADMIN_FEED_CONFIG_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<FeedConfigResponse>> updateFeedConfig(
            @Valid @RequestBody UpdateFeedConfigRequest request) {
        UUID adminId = SecurityUtility.getCurrentUserId();
        FeedConfigResponse response = dynamicFeedConfigService.updateConfig(request, adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_FEED_CONFIG_UPDATED, response));
    }

    @PostMapping(AdminConstants.ADMIN_FEED_CONFIG_RESET_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<FeedConfigResponse>> resetFeedConfig() {
        UUID adminId = SecurityUtility.getCurrentUserId();
        FeedConfigResponse response = dynamicFeedConfigService.resetToDefault(adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_FEED_CONFIG_UPDATED, response));
    }
}

