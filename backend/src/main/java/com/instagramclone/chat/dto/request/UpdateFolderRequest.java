package com.instagramclone.chat.dto.request;

import com.instagramclone.chat.constants.ChatConstants;
import com.instagramclone.chat.enums.InboxFolder;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFolderRequest {

    @NotNull(message = ChatConstants.VALIDATION_FOLDER_REQUIRED)
    private InboxFolder folder;
}

