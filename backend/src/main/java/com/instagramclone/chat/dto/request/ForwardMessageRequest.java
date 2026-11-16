package com.instagramclone.chat.dto.request;

import com.instagramclone.chat.constants.ChatConstants;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
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
public class ForwardMessageRequest {

    @NotEmpty(message = ChatConstants.ERR_FORWARD_EMPTY_TARGETS)
    @Size(max = ChatConstants.MAX_FORWARD_TARGETS, message = ChatConstants.ERR_FORWARD_MAX_TARGETS)
    private List<UUID> targetConversationIds;
}

