package com.instagramclone.chat.dto.response;

import com.instagramclone.chat.enums.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageReplySummaryResponse {
    private UUID messageId;
    private UUID senderId;
    private String senderUsername;
    private String contentSnippet;
    private MessageType messageType;
    private String mediaUrl;
    private Boolean isDeleted;
}

