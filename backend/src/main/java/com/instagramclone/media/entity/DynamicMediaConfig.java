package com.instagramclone.media.entity;

import com.instagramclone.common.entity.BaseAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "dynamic_media_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DynamicMediaConfig extends BaseAuditableEntity {

    @Column(name = "max_reel_bytes", nullable = false)
    @Builder.Default
    private Long maxReelBytes = 262144000L; // 250MB

    @Column(name = "max_post_bytes", nullable = false)
    @Builder.Default
    private Long maxPostBytes = 104857600L; // 100MB

    @Column(name = "max_reel_duration_sec", nullable = false)
    @Builder.Default
    private Integer maxReelDurationSec = 90;

    @Column(name = "max_story_duration_sec", nullable = false)
    @Builder.Default
    private Integer maxStoryDurationSec = 60;

    @Column(name = "allowed_mime_types", nullable = false, length = 500)
    @Builder.Default
    private String allowedMimeTypes = "video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp";
}
