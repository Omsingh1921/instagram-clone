package com.instagramclone.admin.controller;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.mail.dto.request.DynamicEmailConfigRequest;
import com.instagramclone.mail.dto.request.DynamicEmailTemplateRequest;
import com.instagramclone.mail.dto.request.PreviewEmailTemplateRequest;
import com.instagramclone.mail.dto.request.TestEmailConfigRequest;
import com.instagramclone.mail.dto.request.UpdateEmailServerConfigRequest;
import com.instagramclone.mail.dto.response.DynamicEmailConfigResponse;
import com.instagramclone.mail.dto.response.DynamicEmailTemplateResponse;
import com.instagramclone.mail.dto.response.EmailServerConfigResponse;
import com.instagramclone.mail.dto.response.PreviewEmailTemplateResponse;
import com.instagramclone.mail.enums.EmailCategory;
import com.instagramclone.mail.enums.EmailType;
import com.instagramclone.mail.service.interfaces.IDynamicEmailConfigService;
import com.instagramclone.mail.service.interfaces.IDynamicEmailServerConfigService;
import com.instagramclone.mail.service.interfaces.IDynamicEmailTemplateService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(AdminConstants.BASE_PATH)
@RequiredArgsConstructor
public class AdminEmailController {

    private final IDynamicEmailConfigService dynamicEmailConfigService;
    private final IDynamicEmailTemplateService dynamicEmailTemplateService;
    private final IDynamicEmailServerConfigService dynamicEmailServerConfigService;

    @GetMapping(AdminConstants.ADMIN_EMAIL_CONFIGS_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<List<DynamicEmailConfigResponse>>> getEmailConfigs() {
        List<DynamicEmailConfigResponse> configs = dynamicEmailConfigService.getAllConfigs();
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_EMAIL_CONFIGS_RETRIEVED, configs));
    }

    @GetMapping(AdminConstants.ADMIN_EMAIL_CONFIG_BY_CATEGORY_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<DynamicEmailConfigResponse>> getEmailConfigByCategory(
            @PathVariable EmailCategory category) {
        DynamicEmailConfigResponse config = dynamicEmailConfigService.getConfigByCategory(category);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_EMAIL_CONFIG_RETRIEVED, config));
    }

    @PutMapping(AdminConstants.ADMIN_EMAIL_CONFIGS_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<DynamicEmailConfigResponse>> updateEmailConfig(
            @Valid @RequestBody DynamicEmailConfigRequest request) {
        DynamicEmailConfigResponse config = dynamicEmailConfigService.saveOrUpdateConfig(request);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_EMAIL_CONFIG_UPDATED, config));
    }

    @PostMapping(AdminConstants.ADMIN_EMAIL_CONFIG_TEST_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<Void>> sendTestEmail(
            @Valid @RequestBody TestEmailConfigRequest request) {
        dynamicEmailConfigService.sendTestEmail(request);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_TEST_EMAIL_SENT, null));
    }

    @GetMapping(AdminConstants.ADMIN_EMAIL_TEMPLATES_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<List<DynamicEmailTemplateResponse>>> getEmailTemplates() {
        List<DynamicEmailTemplateResponse> templates = dynamicEmailTemplateService.getAllTemplates();
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_EMAIL_TEMPLATES_RETRIEVED, templates));
    }

    @GetMapping(AdminConstants.ADMIN_EMAIL_TEMPLATE_BY_TYPE_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<DynamicEmailTemplateResponse>> getEmailTemplateByType(
            @PathVariable EmailType emailType) {
        DynamicEmailTemplateResponse template = dynamicEmailTemplateService.getTemplateByType(emailType);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_EMAIL_TEMPLATE_RETRIEVED, template));
    }

    @PutMapping(AdminConstants.ADMIN_EMAIL_TEMPLATES_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<DynamicEmailTemplateResponse>> updateEmailTemplate(
            @Valid @RequestBody DynamicEmailTemplateRequest request) {
        DynamicEmailTemplateResponse template = dynamicEmailTemplateService.saveOrUpdateTemplate(request);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_EMAIL_TEMPLATE_UPDATED, template));
    }

    @PostMapping(AdminConstants.ADMIN_EMAIL_TEMPLATE_PREVIEW_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<PreviewEmailTemplateResponse>> previewEmailTemplate(
            @Valid @RequestBody PreviewEmailTemplateRequest request) {
        PreviewEmailTemplateResponse preview = dynamicEmailTemplateService.previewTemplate(request);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_EMAIL_TEMPLATE_PREVIEWED, preview));
    }

    @PostMapping(AdminConstants.ADMIN_EMAIL_TEMPLATE_RESET_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<Void>> resetEmailTemplate(@PathVariable EmailType emailType) {
        dynamicEmailTemplateService.resetTemplateToDefault(emailType);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_EMAIL_TEMPLATE_RESET, null));
    }

    @GetMapping(AdminConstants.ADMIN_EMAIL_SERVER_CONFIG_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<EmailServerConfigResponse>> getEmailServerConfig() {
        EmailServerConfigResponse response = dynamicEmailServerConfigService.getConfigResponse();
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_EMAIL_SERVER_CONFIG_RETRIEVED, response));
    }

    @PutMapping(AdminConstants.ADMIN_EMAIL_SERVER_CONFIG_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<EmailServerConfigResponse>> updateEmailServerConfig(
            @Valid @RequestBody UpdateEmailServerConfigRequest request) {
        UUID adminId = SecurityUtility.getCurrentUserId();
        EmailServerConfigResponse response = dynamicEmailServerConfigService.updateConfig(request, adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_EMAIL_SERVER_CONFIG_UPDATED, response));
    }

    @PostMapping(AdminConstants.ADMIN_EMAIL_SERVER_RESET_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<EmailServerConfigResponse>> resetEmailServerConfig() {
        UUID adminId = SecurityUtility.getCurrentUserId();
        EmailServerConfigResponse response = dynamicEmailServerConfigService.resetToDefault(adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_EMAIL_SERVER_CONFIG_UPDATED, response));
    }

    @PostMapping(AdminConstants.ADMIN_EMAIL_SERVER_TEST_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<Void>> testEmailServerConnection(
            @RequestParam(required = false, defaultValue = "admin@instagramclone.com") String recipient) {
        UUID adminId = SecurityUtility.getCurrentUserId();
        dynamicEmailServerConfigService.sendTestEmail(recipient, adminId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_TEST_EMAIL_SENT, null));
    }
}

