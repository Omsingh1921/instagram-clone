package com.instagramclone.admin.mapper;

import com.instagramclone.admin.dto.response.AdminUserResponse;
import com.instagramclone.admin.dto.response.ReportResponse;
import com.instagramclone.admin.entity.Report;
import com.instagramclone.media.service.interfaces.IMediaUrlService;
import com.instagramclone.user.dto.response.UserSummaryResponse;
import com.instagramclone.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Pure Entity-to-DTO mapper for Admin moderation, analytics, and user management views.
 */
@Component
@RequiredArgsConstructor
public class AdminMapper {

    private final IMediaUrlService mediaUrlService;

    public String maskUrl(String url) {
        if (url == null) {
            return null;
        }
        return mediaUrlService != null ? mediaUrlService.maskUrl(url) : url;
    }

    public UserSummaryResponse toUserSummary(User user) {
        if (user == null) {
            return null;
        }
        String avatar = user.getProfile() != null ? maskUrl(user.getProfile().getAvatarUrl()) : null;
        return UserSummaryResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getProfile() != null ? user.getProfile().getDisplayName() : null)
                .avatarUrl(avatar)
                .build();
    }

    public UserSummaryResponse toUnmaskedUserSummary(User user) {
        if (user == null) {
            return null;
        }
        return UserSummaryResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getProfile() != null ? user.getProfile().getDisplayName() : null)
                .avatarUrl(user.getProfile() != null ? user.getProfile().getAvatarUrl() : null)
                .build();
    }

    public AdminUserResponse toAdminUserResponse(
            User user,
            long postsCount,
            long followersCount,
            long followingCount) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getProfile() != null ? user.getProfile().getDisplayName() : null)
                .avatarUrl(user.getProfile() != null ? user.getProfile().getAvatarUrl() : null)
                .role(user.getRole())
                .status(user.getStatus())
                .isActive(user.getIsActive())
                .isDeleted(user.getIsDeleted())
                .emailVerified(user.getEmailVerified())
                .postsCount(postsCount)
                .followersCount(followersCount)
                .followingCount(followingCount)
                .createdAt(user.getCreatedAt())
                .build();
    }

    public ReportResponse toReportResponse(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .reporter(toUnmaskedUserSummary(report.getReporter()))
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .reasonCode(report.getReasonCode())
                .description(report.getDescription())
                .status(report.getStatus())
                .action(report.getAction())
                .reviewer(toUnmaskedUserSummary(report.getReviewer()))
                .resolutionNotes(report.getResolutionNotes())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .resolvedAt(report.getResolvedAt())
                .build();
    }
}

