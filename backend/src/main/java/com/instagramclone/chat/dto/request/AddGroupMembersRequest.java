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
public class AddGroupMembersRequest {

    @NotEmpty(message = ChatConstants.VALIDATION_MEMBER_IDS_EMPTY_MESSAGE)
    @Size(max = ChatConstants.MAX_GROUP_MEMBERS, message = ChatConstants.VALIDATION_MEMBER_IDS_MAX_MESSAGE)
    private List<UUID> memberIds;
}
