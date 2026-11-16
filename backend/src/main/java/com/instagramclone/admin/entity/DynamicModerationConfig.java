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
@Table(name = "dynamic_moderation_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DynamicModerationConfig extends BaseAuditableEntity {

    @Column(name = "auto_quarantine_report_threshold", nullable = false)
    @Builder.Default
    private Integer autoQuarantineReportThreshold = 5;

    @Column(name = "profanity_banned_words", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String profanityBannedWords = "spam,scam,fraud,hate,abuse,harassment,malware";

    @Column(name = "nsfw_blur_threshold", nullable = false)
    @Builder.Default
    private Double nsfwBlurThreshold = 0.85;

    @Column(name = "copyright_strike_limit", nullable = false)
    @Builder.Default
    private Integer copyrightStrikeLimit = 3;
}
