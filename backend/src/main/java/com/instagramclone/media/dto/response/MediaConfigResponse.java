package com.instagramclone.media.dto.response;

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
public class MediaConfigResponse {

    private UUID id;
    private Long maxReelBytes;
    private Long maxPostBytes;
    private Integer maxReelDurationSec;
    private Integer maxStoryDurationSec;
    private String allowedMimeTypes;
    private LocalDateTime updatedAt;
}
