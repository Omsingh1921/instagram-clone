package com.instagramclone.reel.entity;

import com.instagramclone.common.entity.BaseAuditableEntity;
import lombok.experimental.SuperBuilder;
import com.instagramclone.reel.enums.ReelStatus;

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
@Table(name = "reels")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Reel extends BaseAuditableEntity {
@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "video_url", nullable = false, length = 700)
    private String videoUrl;

    @Column(name = "thumbnail_url", length = 700)
    private String thumbnailUrl;

    @Column(name = "caption", columnDefinition = "TEXT")
    private String caption;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ReelStatus status = ReelStatus.READY;

    @Column(name = "duration_ms", nullable = false)
    @Builder.Default
    private Long durationMs = 0L;

    @Column(name = "audio_title", length = 150)
    private String audioTitle;

    @Column(name = "audio_artist", length = 150)
    private String audioArtist;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private boolean isArchived = false;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private boolean isPinned = false;

    @Column(name = "hide_like_count", nullable = false)
    @Builder.Default
    private boolean hideLikeCount = false;

    @Column(name = "comments_disabled", nullable = false)
    @Builder.Default
    private boolean commentsDisabled = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remix_reel_id")
    private Reel remixOfReel;

    @Column(name = "is_permanently_deleted", nullable = false)
    @Builder.Default
    private boolean isPermanentlyDeleted = false;

    @Column(name = "permanently_deleted_at")
    private LocalDateTime permanentlyDeletedAt;

    public void archive() {
        this.isArchived = true;
        this.archivedAt = LocalDateTime.now();
    }

    public void unarchive() {
        this.isArchived = false;
        this.archivedAt = null;
    }

    public void markPermanentlyDeleted() {
        softDelete();
        this.isPermanentlyDeleted = true;
        this.permanentlyDeletedAt = LocalDateTime.now();
    }
}
