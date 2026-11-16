package com.instagramclone.story.entity;

import com.instagramclone.common.entity.BaseCreatedEntity;
import lombok.experimental.SuperBuilder;
import com.instagramclone.post.enums.MediaType;
import com.instagramclone.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "stories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Story extends BaseCreatedEntity {
@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "media_url", nullable = false, length = 700)
    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 20)
    @Builder.Default
    private MediaType mediaType = MediaType.IMAGE;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "caption", length = 500)
    private String caption;

    @Column(name = "is_close_friends_only", nullable = false)
    @Builder.Default
    private boolean isCloseFriendsOnly = false;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private Boolean isArchived = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_post_id")
    private com.instagramclone.post.entity.Post sharedPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_reel_id")
    private com.instagramclone.reel.entity.Reel sharedReel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_story_id")
    private Story sharedStory;

    @Column(name = "audio_title", length = 150)
    private String audioTitle;

    @Column(name = "audio_artist", length = 150)
    private String audioArtist;

    @Column(name = "audio_url", length = 700)
    private String audioUrl;

    @Column(name = "filter_name", length = 50)
    private String filterName;

    @jakarta.persistence.OneToOne(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private StoryPoll poll;

    @jakarta.persistence.OneToOne(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private StoryQuestion question;

    @jakarta.persistence.OneToOne(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private StoryQuiz quiz;

    @jakarta.persistence.OneToOne(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private StorySlider slider;

    @jakarta.persistence.OneToOne(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private StoryCountdown countdown;

    @jakarta.persistence.OneToOne(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private StoryAddYours addYours;

    @jakarta.persistence.OneToOne(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private StoryInsight insight;

    @jakarta.persistence.OneToMany(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<StoryView> views = new java.util.ArrayList<>();

    @jakarta.persistence.OneToMany(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<StoryMention> mentions = new java.util.ArrayList<>();

    @jakarta.persistence.OneToMany(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<StoryLink> links = new java.util.ArrayList<>();

    @jakarta.persistence.OneToMany(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<StoryLocation> locations = new java.util.ArrayList<>();

    @jakarta.persistence.OneToMany(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<StoryHashtag> hashtags = new java.util.ArrayList<>();

    @jakarta.persistence.OneToMany(mappedBy = "story", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<StoryReaction> reactions = new java.util.ArrayList<>();

    public void softDelete() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }

    public void restore() {
        this.isDeleted = false;
        this.deletedAt = null;
    }
}
