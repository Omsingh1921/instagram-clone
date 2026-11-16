package com.instagramclone.chat.dto.response;

import com.instagramclone.chat.enums.MessageType;
import com.instagramclone.post.dto.response.PostAuthorResponse;
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
public class MessageResponse {

    private UUID id;
    private UUID conversationId;
    private PostAuthorResponse sender;
    private String content;
    private MessageType messageType;
    private String mediaUrl;
    private Boolean isDeleted;
    private Boolean isViewOnce;
    private Boolean isOpened;

    private MessageReplySummaryResponse replyTo;
    private Boolean isEdited;
    private LocalDateTime editedAt;
    private Boolean isPinnedInChat;
    private LocalDateTime pinnedAt;
    private Boolean isForwarded;
    private Integer durationMs;
    private String waveform;

    @Builder.Default
    private List<MessageReactionResponse> reactions = new ArrayList<>();

    private LocalDateTime createdAt;
}
