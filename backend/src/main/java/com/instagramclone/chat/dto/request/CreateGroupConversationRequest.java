package com.instagramclone.chat.dto.request;

import com.instagramclone.chat.constants.ChatConstants;
import jakarta.validation.constraints.NotBlank;
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
public class CreateGroupConversationRequest {

    @NotBlank(message = ChatConstants.VALIDATION_GROUP_NAME_REQUIRED)
    @Size(min = ChatConstants.GROUP_NAME_MIN_LENGTH, max = ChatConstants.GROUP_NAME_MAX_LENGTH, message = ChatConstants.VALIDATION_GROUP_NAME_LENGTH_MESSAGE)
    private String name;

    @NotEmpty(message = ChatConstants.VALIDATION_GROUP_MEMBERS_REQUIRED)
    @Size(max = ChatConstants.MAX_GROUP_MEMBERS, message = ChatConstants.VALIDATION_GROUP_MEMBERS_MAX_MESSAGE)
    private List<UUID> memberIds;

    @Size(max = ChatConstants.MAX_AVATAR_URL_LENGTH, message = ChatConstants.VALIDATION_AVATAR_URL_MAX_LENGTH_MESSAGE)
    private String avatarUrl;
}
