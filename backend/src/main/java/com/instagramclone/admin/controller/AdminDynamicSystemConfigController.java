package com.instagramclone.admin.controller;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.dto.request.UpdateDynamicSystemConfigRequest;
import com.instagramclone.admin.dto.response.DynamicSystemConfigResponse;
import com.instagramclone.admin.service.interfaces.IDynamicSystemConfigService;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.utility.SecurityUtility;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(AdminConstants.BASE_PATH)
@RequiredArgsConstructor
public class AdminDynamicSystemConfigController {

    private final IDynamicSystemConfigService dynamicSystemConfigService;

    @GetMapping(AdminConstants.ADMIN_DYNAMIC_CONFIG_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<List<DynamicSystemConfigResponse>>> getDynamicConfigs() {
        List<DynamicSystemConfigResponse> configs = dynamicSystemConfigService.getAllConfigs();
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_DYNAMIC_CONFIGS_RETRIEVED, configs));
    }

    @PutMapping(AdminConstants.ADMIN_DYNAMIC_CONFIG_BY_KEY_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<DynamicSystemConfigResponse>> updateDynamicConfig(
            @PathVariable String key,
            @Valid @RequestBody UpdateDynamicSystemConfigRequest request) {
        UUID adminId = SecurityUtility.getCurrentUserId();
        DynamicSystemConfigResponse response = dynamicSystemConfigService.updateConfig(key, request, adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_DYNAMIC_CONFIG_UPDATED, response));
    }

    @PostMapping(AdminConstants.ADMIN_DYNAMIC_CONFIG_RESET_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<DynamicSystemConfigResponse>> resetDynamicConfig(@PathVariable String key) {
        UUID adminId = SecurityUtility.getCurrentUserId();
        DynamicSystemConfigResponse response = dynamicSystemConfigService.resetConfig(key, adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_DYNAMIC_CONFIG_RESET, response));
    }

    @PostMapping(AdminConstants.ADMIN_DYNAMIC_CONFIG_RESET_ALL_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<List<DynamicSystemConfigResponse>>> resetAllDynamicConfigs() {
        UUID adminId = SecurityUtility.getCurrentUserId();
        List<DynamicSystemConfigResponse> response = dynamicSystemConfigService.resetAllConfigs(adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_DYNAMIC_CONFIGS_RESET_ALL, response));
    }

    @GetMapping(AdminConstants.PUBLIC_DYNAMIC_CONFIG_PATH)
    public ResponseEntity<ApiResponse<List<DynamicSystemConfigResponse>>> getPublicDynamicConfigs() {
        List<DynamicSystemConfigResponse> configs = dynamicSystemConfigService.getPublicConfigs();
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_DYNAMIC_CONFIGS_RETRIEVED, configs));
    }
}

