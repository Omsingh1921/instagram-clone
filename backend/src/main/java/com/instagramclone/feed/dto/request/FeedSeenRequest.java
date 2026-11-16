package com.instagramclone.feed.dto.request;

import com.instagramclone.feed.constants.FeedConstants;
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
public class FeedSeenRequest {

    @NotEmpty(message = FeedConstants.VALIDATION_SEEN_ITEM_IDS_REQUIRED)
    private List<UUID> itemIds;
}

