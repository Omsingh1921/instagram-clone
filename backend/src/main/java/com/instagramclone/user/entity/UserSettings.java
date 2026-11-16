package com.instagramclone.user.entity;

import com.instagramclone.common.entity.BaseAuditableEntity;
import com.instagramclone.user.enums.DigestFrequency;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UserSettings extends BaseAuditableEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "is_private", nullable = false)
    @Builder.Default
    private boolean isPrivate = false;

    @Column(name = "notify_likes", nullable = false)
    @Builder.Default
    private boolean notifyLikes = true;

    @Column(name = "notify_comments", nullable = false)
    @Builder.Default
    private boolean notifyComments = true;

    @Column(name = "notify_follows", nullable = false)
    @Builder.Default
    private boolean notifyFollows = true;

    @Column(name = "notify_messages", nullable = false)
    @Builder.Default
    private boolean notifyMessages = true;

    // Granular Email Notification Preferences
    @Column(name = "email_social_follows", nullable = false)
    @Builder.Default
    private boolean emailSocialFollows = true;

    @Column(name = "email_social_likes", nullable = false)
    @Builder.Default
    private boolean emailSocialLikes = true;

    @Column(name = "email_social_comments", nullable = false)
    @Builder.Default
    private boolean emailSocialComments = true;

    @Column(name = "email_message_reminders", nullable = false)
    @Builder.Default
    private boolean emailMessageReminders = true;

    @Column(name = "email_activity_digest", nullable = false)
    @Builder.Default
    private boolean emailActivityDigest = false;

    @Column(name = "email_product_announcements", nullable = false)
    @Builder.Default
    private boolean emailProductAnnouncements = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "digest_frequency", nullable = false, length = 20)
    @Builder.Default
    private DigestFrequency digestFrequency = DigestFrequency.WEEKLY;

    @Column(name = "filtered_keywords", columnDefinition = "TEXT")
    private String filteredKeywords;

    @Column(name = "hide_offensive_comments", nullable = false)
    @Builder.Default
    private boolean hideOffensiveComments = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "story_replies_allowed", nullable = false, length = 20)
    @Builder.Default
    private com.instagramclone.user.enums.StoryReplyPermission storyRepliesAllowed = com.instagramclone.user.enums.StoryReplyPermission.EVERYONE;

    @Column(name = "allow_story_sharing", nullable = false)
    @Builder.Default
    private boolean allowStorySharing = true;

    @Column(name = "allow_story_resharing", nullable = false)
    @Builder.Default
    private boolean allowStoryResharing = true;

    @Column(name = "hide_like_and_share_counts", nullable = false)
    @Builder.Default
    private boolean hideLikeAndShareCounts = false;

    @Column(name = "allow_tags_from", nullable = false, length = 30)
    @Builder.Default
    private String allowTagsFrom = "EVERYONE";

    @Column(name = "allow_mentions_from", nullable = false, length = 30)
    @Builder.Default
    private String allowMentionsFrom = "EVERYONE";

    @Column(name = "save_stories_to_archive", nullable = false)
    @Builder.Default
    private boolean saveStoriesToArchive = true;

    @Column(name = "break_reminder_minutes", nullable = false)
    @Builder.Default
    private int breakReminderMinutes = 0;
}

