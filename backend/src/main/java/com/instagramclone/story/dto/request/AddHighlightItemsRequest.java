package com.instagramclone.story.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddHighlightItemsRequest {

    @NotEmpty(message = "Story IDs list cannot be empty")
    private List<UUID> storyIds;
}
