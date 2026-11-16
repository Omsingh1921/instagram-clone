package com.instagramclone.user.dto.response;

import com.instagramclone.story.dto.response.StoryResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsResponse {

    private String username;
    private PrivacySettings privacy;
    private NotificationPreferences notifications;
    private String accountStatus;
    private String filteredKeywords;
    private Boolean hideOffensiveComments;
    private Boolean allowStorySharing;
    private Boolean allowStoryResharing;
    private Boolean hideLikeAndShareCounts;
    private String allowTagsFrom;
    private String allowMentionsFrom;
    private Boolean saveStoriesToArchive;
    private Integer breakReminderMinutes;

    @Builder.Default
    private List<StoryResponse> stories = new ArrayList<>();

    @Builder.Default
    private Boolean hasStory = false;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrivacySettings {
        private boolean privateAccount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationPreferences {
        private boolean likes;
        private boolean comments;
        private boolean followers;
        private boolean messages;
    }
}
