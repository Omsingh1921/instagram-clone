package com.instagramclone.user.controller;

import com.instagramclone.auth.dto.request.ChangePasswordRequest;
import com.instagramclone.common.constants.ApiConstants;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.follow.dto.response.FollowUserResponse;
import com.instagramclone.mail.dto.request.UpdateEmailPreferencesRequest;
import com.instagramclone.mail.dto.response.EmailPreferencesResponse;
import com.instagramclone.mail.service.interfaces.IEmailPreferenceService;
import com.instagramclone.ratelimit.RateLimit;
import com.instagramclone.user.constants.SettingsConstants;
import com.instagramclone.user.dto.request.BlockUserRequest;
import com.instagramclone.user.dto.request.InitiateEmailChangeRequest;
import com.instagramclone.user.dto.request.ScreenTimeHeartbeatRequest;
import com.instagramclone.user.dto.request.UpdateSettingsRequest;
import com.instagramclone.user.dto.response.AccountCreatedResponse;
import com.instagramclone.user.dto.response.BlockStatusResponse;
import com.instagramclone.user.dto.response.BlockedUserResponse;
import com.instagramclone.user.dto.response.EmailChangeResponse;
import com.instagramclone.user.dto.response.PasswordHistoryResponse;
import com.instagramclone.user.dto.response.ScreenTimeHeartbeatResponse;
import com.instagramclone.user.dto.response.ScreenTimeSummaryResponse;
import com.instagramclone.user.dto.response.UserSettingsResponse;
import com.instagramclone.user.service.interfaces.IEmailChangeService;
import com.instagramclone.user.service.interfaces.ISettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping(SettingsConstants.USERS_BASE_PATH)
@RequiredArgsConstructor
public class SettingsController {

    private final ISettingsService settingsService;
    private final IEmailPreferenceService emailPreferenceService;
    private final IEmailChangeService emailChangeService;

    @RateLimit(category = SettingsConstants.RATE_LIMIT_EMAIL_CHANGE)
    @PostMapping(SettingsConstants.PATH_ME_EMAIL)
    public ResponseEntity<ApiResponse<EmailChangeResponse>> initiateEmailChange(
            @Valid @RequestBody InitiateEmailChangeRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        EmailChangeResponse response = emailChangeService.initiateEmailChange(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_EMAIL_CHANGE_DISPATCHED, response));
    }

    @DeleteMapping(SettingsConstants.PATH_ME_EMAIL)
    public ResponseEntity<ApiResponse<Void>> cancelPendingEmailChange() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        emailChangeService.cancelPendingEmailChange(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_EMAIL_CHANGE_CANCELLED, null));
    }

    @GetMapping(SettingsConstants.PATH_ME_EMAIL_PREFERENCES)
    public ResponseEntity<ApiResponse<EmailPreferencesResponse>> getEmailPreferences() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        EmailPreferencesResponse response = emailPreferenceService.getPreferences(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_EMAIL_PREFERENCES_RETRIEVED, response));
    }

    @PutMapping(SettingsConstants.PATH_ME_EMAIL_PREFERENCES)
    public ResponseEntity<ApiResponse<EmailPreferencesResponse>> updateEmailPreferences(
            @Valid @RequestBody UpdateEmailPreferencesRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        EmailPreferencesResponse response = emailPreferenceService.updatePreferences(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_EMAIL_PREFERENCES_UPDATED, response));
    }

    @GetMapping(SettingsConstants.PATH_ME_SETTINGS)
    public ResponseEntity<ApiResponse<UserSettingsResponse>> getUserSettings() {
        UserSettingsResponse response = settingsService.getUserSettings();
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_SETTINGS_FETCHED_SUCCESS, response));
    }

    @PutMapping(SettingsConstants.PATH_ME_SETTINGS)
    public ResponseEntity<ApiResponse<UserSettingsResponse>> updateSettings(
            @Valid @RequestBody UpdateSettingsRequest request) {
        UserSettingsResponse response = settingsService.updateSettings(request);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_SETTINGS_UPDATED_SUCCESS, response));
    }

    @RateLimit(category = SettingsConstants.RATE_LIMIT_PASSWORD)
    @PutMapping(SettingsConstants.PATH_ME_PASSWORD)
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        settingsService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_PASSWORD_CHANGED_SUCCESS, null));
    }

    @PostMapping(SettingsConstants.PATH_USER_BLOCK)
    public ResponseEntity<ApiResponse<Void>> blockUser(
            @PathVariable UUID userId,
            @RequestBody(required = false) BlockUserRequest request) {
        settingsService.blockUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_USER_BLOCKED_SUCCESS, null));
    }

    @DeleteMapping(SettingsConstants.PATH_USER_BLOCK)
    public ResponseEntity<ApiResponse<Void>> unblockUser(@PathVariable UUID userId) {
        settingsService.unblockUser(userId);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_USER_UNBLOCKED_SUCCESS, null));
    }

    @GetMapping(SettingsConstants.PATH_USER_BLOCK_STATUS)
    public ResponseEntity<ApiResponse<BlockStatusResponse>> getBlockStatus(@PathVariable UUID userId) {
        BlockStatusResponse response = settingsService.getBlockStatus(userId);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_BLOCK_STATUS_RETRIEVED, response));
    }

    @GetMapping(SettingsConstants.PATH_ME_BLOCKS)
    public ResponseEntity<ApiResponse<PageResponse<BlockedUserResponse>>> getBlockedUsers(
            @RequestParam(required = false) String query,
            @PageableDefault(size = ApiConstants.DEFAULT_PAGE_SIZE_20, sort = ApiConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<BlockedUserResponse> blocked = settingsService.getBlockedUsers(query, pageable);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_BLOCKED_USERS_RETRIEVED, blocked));
    }

    @PostMapping(SettingsConstants.PATH_USER_MUTE)
    public ResponseEntity<ApiResponse<Void>> muteUser(
            @PathVariable UUID userId,
            @RequestParam(required = false, defaultValue = "true") boolean mutePosts,
            @RequestParam(required = false, defaultValue = "true") boolean muteStories) {
        settingsService.muteUser(userId, mutePosts, muteStories);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_USER_MUTED_SUCCESS, null));
    }

    @DeleteMapping(SettingsConstants.PATH_USER_MUTE)
    public ResponseEntity<ApiResponse<Void>> unmuteUser(@PathVariable UUID userId) {
        settingsService.unmuteUser(userId);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_USER_UNMUTED_SUCCESS, null));
    }

    @GetMapping(SettingsConstants.PATH_USER_MUTE)
    public ResponseEntity<ApiResponse<Boolean>> isUserMuted(@PathVariable UUID userId) {
        boolean muted = settingsService.isUserMuted(userId);
        return ResponseEntity.ok(ApiResponse.success(muted));
    }

    @GetMapping("/muted")
    public ResponseEntity<ApiResponse<PageResponse<FollowUserResponse>>> getMutedUsers(
            @PageableDefault(size = ApiConstants.DEFAULT_PAGE_SIZE_20, sort = ApiConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<FollowUserResponse> muted = settingsService.getMutedUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success("Muted accounts retrieved successfully", muted));
    }

    @PostMapping(SettingsConstants.PATH_ME_SCREEN_TIME_HEARTBEAT)
    public ResponseEntity<ApiResponse<ScreenTimeHeartbeatResponse>> recordScreenTimeHeartbeat(
            @Valid @RequestBody ScreenTimeHeartbeatRequest request) {
        ScreenTimeHeartbeatResponse response = settingsService.recordScreenTimeHeartbeat(request);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_SCREEN_TIME_UPDATED, response));
    }

    @GetMapping(SettingsConstants.PATH_ME_SCREEN_TIME)
    public ResponseEntity<ApiResponse<ScreenTimeSummaryResponse>> getScreenTimeSummary(
            @RequestParam(required = false, defaultValue = "7") int days,
            @RequestParam(required = false) LocalDate today) {
        ScreenTimeSummaryResponse response = settingsService.getScreenTimeSummary(days, today);
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_SCREEN_TIME_RETRIEVED, response));
    }

    @GetMapping(SettingsConstants.PATH_ME_ACCOUNT_CREATED)
    public ResponseEntity<ApiResponse<AccountCreatedResponse>> getAccountCreated() {
        AccountCreatedResponse response = settingsService.getAccountCreated();
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_ACCOUNT_CREATED_RETRIEVED, response));
    }

    @GetMapping(SettingsConstants.PATH_ME_PASSWORD_HISTORY)
    public ResponseEntity<ApiResponse<PasswordHistoryResponse>> getPasswordHistory() {
        PasswordHistoryResponse response = settingsService.getPasswordHistory();
        return ResponseEntity.ok(ApiResponse.success(SettingsConstants.MSG_PASSWORD_HISTORY_RETRIEVED, response));
    }
}
