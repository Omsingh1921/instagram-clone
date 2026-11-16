package com.instagramclone.user.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockStatusResponse {
    private UUID targetUserId;

    @JsonProperty("hasBlocked")
    private boolean hasBlocked;     // viewer blocked target

    @JsonProperty("isBlockedBy")
    private boolean isBlockedBy;    // target blocked viewer

    @JsonProperty("isBlocked")
    private boolean isBlocked;      // hasBlocked || isBlockedBy

    @JsonProperty("canInteract")
    private boolean canInteract;    // !isBlocked
}
