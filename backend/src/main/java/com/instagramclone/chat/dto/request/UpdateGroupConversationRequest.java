package com.instagramclone.chat.dto.request;

import com.instagramclone.chat.constants.ChatConstants;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroupConversationRequest {

    @Size(min = ChatConstants.GROUP_NAME_MIN_LENGTH, max = ChatConstants.GROUP_NAME_MAX_LENGTH, message = ChatConstants.VALIDATION_GROUP_NAME_LENGTH_MESSAGE)
    private String name;

    @Size(max = ChatConstants.MAX_AVATAR_URL_LENGTH, message = ChatConstants.VALIDATION_AVATAR_URL_MAX_LENGTH_MESSAGE)
    private String avatarUrl;
}
