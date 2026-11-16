package com.instagramclone.note.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.instagramclone.user.dto.response.UserSummaryResponse;
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
public class NoteResponse {

    private UUID id;
    private UserSummaryResponse user;
    private String text;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    @JsonProperty("isOwnNote")
    private boolean isOwnNote;
}
