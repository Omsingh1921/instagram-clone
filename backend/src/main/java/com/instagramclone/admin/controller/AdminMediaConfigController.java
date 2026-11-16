package com.instagramclone.admin.controller;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.media.dto.request.UpdateMediaConfigRequest;
import com.instagramclone.media.dto.response.MediaConfigResponse;
import com.instagramclone.media.service.interfaces.IDynamicMediaConfigService;
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
public class AdminMediaConfigController {

    private final IDynamicMediaConfigService dynamicMediaConfigService;

    @GetMapping(AdminConstants.ADMIN_MEDIA_CONFIG_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<MediaConfigResponse>> getMediaConfig() {
        MediaConfigResponse response = dynamicMediaConfigService.getConfigResponse();
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_MEDIA_CONFIG_RETRIEVED, response));
    }

    @PutMapping(AdminConstants.ADMIN_MEDIA_CONFIG_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<MediaConfigResponse>> updateMediaConfig(
            @Valid @RequestBody UpdateMediaConfigRequest request) {
        UUID adminId = SecurityUtility.getCurrentUserId();
        MediaConfigResponse response = dynamicMediaConfigService.updateConfig(request, adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_MEDIA_CONFIG_UPDATED, response));
    }

    @PostMapping(AdminConstants.ADMIN_MEDIA_CONFIG_RESET_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<MediaConfigResponse>> resetMediaConfig() {
        UUID adminId = SecurityUtility.getCurrentUserId();
        MediaConfigResponse response = dynamicMediaConfigService.resetToDefault(adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_MEDIA_CONFIG_UPDATED, response));
    }

    @GetMapping(AdminConstants.PUBLIC_MEDIA_CONFIG_PATH)
    public ResponseEntity<ApiResponse<MediaConfigResponse>> getPublicMediaConfig() {
        MediaConfigResponse response = dynamicMediaConfigService.getConfigResponse();
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_MEDIA_CONFIG_RETRIEVED, response));
    }
}

