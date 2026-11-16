package com.instagramclone.user.dto.response;

import com.instagramclone.user.enums.BlockReason;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockedUserResponse {
    private UUID id;
    private UUID userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private BlockReason reason;
    private Boolean blockFutureAccounts;
    private LocalDateTime blockedAt;
}

