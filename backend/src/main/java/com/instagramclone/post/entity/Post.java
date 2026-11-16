package com.instagramclone.post.entity;

import com.instagramclone.common.entity.BaseAuditableEntity;
import lombok.experimental.SuperBuilder;
import com.instagramclone.post.enums.PostVisibility;

import com.instagramclone.user.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Post extends BaseAuditableEntity {
@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "caption", columnDefinition = "TEXT")
    private String caption;

    @Column(name = "location")
    private String location;

    @Column(name = "comments_disabled", nullable = false)
    @Builder.Default
    private boolean commentsDisabled = false;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private boolean isPinned = false;

    @Column(name = "pinned_at")
    private LocalDateTime pinnedAt;

    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private boolean isArchived = false;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "hide_like_count", nullable = false)
    @Builder.Default
    private boolean hideLikeCount = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false, length = 20)
    @Builder.Default
    private PostVisibility visibility = PostVisibility.PUBLIC;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collaborator_id")
    private User collaborator;

    @Enumerated(EnumType.STRING)
    @Column(name = "collab_status", nullable = false, length = 20)
    @Builder.Default
    private com.instagramclone.post.enums.CollabStatus collabStatus = com.instagramclone.post.enums.CollabStatus.NONE;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<PostMedia> mediaList = new ArrayList<>();
public void addMedia(PostMedia media) {
        mediaList.add(media);
        media.setPost(this);
    }

    public void removeMedia(PostMedia media) {
        mediaList.remove(media);
        media.setPost(null);
    }
}
