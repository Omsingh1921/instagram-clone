package com.instagramclone.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModerationConfigResponse {

    private UUID id;
    private Integer autoQuarantineReportThreshold;
    private String profanityBannedWords;
    private Double nsfwBlurThreshold;
    private Integer copyrightStrikeLimit;
    private LocalDateTime updatedAt;
}
