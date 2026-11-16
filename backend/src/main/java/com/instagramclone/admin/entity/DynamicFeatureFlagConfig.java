package com.instagramclone.admin.entity;

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
@Table(name = "dynamic_feature_flags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DynamicFeatureFlagConfig extends BaseAuditableEntity {

    @Column(name = "reels_upload_enabled", nullable = false)
    @Builder.Default
    private Boolean reelsUploadEnabled = true;

    @Column(name = "story_creation_enabled", nullable = false)
    @Builder.Default
    private Boolean storyCreationEnabled = true;

    @Column(name = "voice_messages_enabled", nullable = false)
    @Builder.Default
    private Boolean voiceMessagesEnabled = true;

    @Column(name = "maintenance_mode_enabled", nullable = false)
    @Builder.Default
    private Boolean maintenanceModeEnabled = false;

    @Column(name = "maintenance_message", nullable = false, length = 500)
    @Builder.Default
    private String maintenanceMessage = "Instagram is currently undergoing scheduled maintenance. Please check back shortly.";
}
