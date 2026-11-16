package com.instagramclone.user.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
public class PasswordHistoryResponse {

    private LocalDateTime lastChangedAt;
    private long changeCount;

    /**
     * Constructs a password history summary from the aggregate audit-log query.
     *
     * @param lastChangedAt most recent password change timestamp, or null if never changed
     * @param changeCount   total number of password changes recorded
     */
    public PasswordHistoryResponse(LocalDateTime lastChangedAt, Long changeCount) {
        this.lastChangedAt = lastChangedAt;
        this.changeCount = changeCount != null ? changeCount : 0L;
    }

    public PasswordHistoryResponse(LocalDateTime lastChangedAt, long changeCount) {
        this.lastChangedAt = lastChangedAt;
        this.changeCount = changeCount;
    }
}

