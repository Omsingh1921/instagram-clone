package com.instagramclone.user.service.interfaces;

import com.instagramclone.auth.dto.request.ChangePasswordRequest;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.follow.dto.response.FollowUserResponse;
import com.instagramclone.user.dto.request.BlockUserRequest;
import com.instagramclone.user.dto.request.ScreenTimeHeartbeatRequest;
import com.instagramclone.user.dto.request.UpdateSettingsRequest;
import com.instagramclone.user.dto.response.AccountCreatedResponse;
import com.instagramclone.user.dto.response.BlockStatusResponse;
import com.instagramclone.user.dto.response.BlockedUserResponse;
import com.instagramclone.user.dto.response.PasswordHistoryResponse;
import com.instagramclone.user.dto.response.ScreenTimeHeartbeatResponse;
import com.instagramclone.user.dto.response.ScreenTimeSummaryResponse;
import com.instagramclone.user.dto.response.UserSettingsResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface ISettingsService {

    UserSettingsResponse getUserSettings();

    UserSettingsResponse updateSettings(UpdateSettingsRequest request);

    void changePassword(ChangePasswordRequest request);

    void blockUser(UUID targetUserId, BlockUserRequest request);

    default void blockUser(UUID targetUserId) {
        blockUser(targetUserId, null);
    }

    void unblockUser(UUID targetUserId);

    BlockStatusResponse getBlockStatus(UUID targetUserId);

    PageResponse<BlockedUserResponse> getBlockedUsers(String query, Pageable pageable);

    default PageResponse<BlockedUserResponse> getBlockedUsers(Pageable pageable) {
        return getBlockedUsers(null, pageable);
    }

    void muteUser(UUID targetUserId, boolean mutePosts, boolean muteStories);

    void unmuteUser(UUID targetUserId);

    boolean isUserMuted(UUID targetUserId);

    PageResponse<FollowUserResponse> getMutedUsers(Pageable pageable);

    ScreenTimeHeartbeatResponse recordScreenTimeHeartbeat(ScreenTimeHeartbeatRequest request);

    ScreenTimeSummaryResponse getScreenTimeSummary(int days, LocalDate today);

    AccountCreatedResponse getAccountCreated();

    PasswordHistoryResponse getPasswordHistory();
}
