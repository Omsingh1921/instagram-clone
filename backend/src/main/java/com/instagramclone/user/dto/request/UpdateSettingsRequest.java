package com.instagramclone.user.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSettingsRequest {

    private Boolean privateAccount;
    private Boolean notifyLikes;
    private Boolean notifyComments;
    private Boolean notifyFollows;
    private Boolean notifyMessages;
    private String filteredKeywords;
    private Boolean hideOffensiveComments;
    private Boolean allowStorySharing;
    private Boolean allowStoryResharing;
    private Boolean hideLikeAndShareCounts;
    private String allowTagsFrom;
    private String allowMentionsFrom;
    private Boolean saveStoriesToArchive;
    private Integer breakReminderMinutes;
}

