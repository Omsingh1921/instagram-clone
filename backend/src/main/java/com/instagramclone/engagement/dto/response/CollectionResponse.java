package com.instagramclone.engagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionResponse {

    private UUID id;
    private String name;
    private String coverMediaUrl;
    private long itemCount;

    @Builder.Default
    private List<String> previewMediaUrls = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
