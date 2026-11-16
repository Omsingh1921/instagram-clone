package com.instagramclone.chat.dto.request;

import com.instagramclone.chat.constants.ChatConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateChatThemeRequest {

    @NotBlank(message = ChatConstants.VALIDATION_THEME_REQUIRED)
    @Size(max = ChatConstants.MAX_THEME_LENGTH, message = ChatConstants.VALIDATION_THEME_MAX_LENGTH_MESSAGE)
    private String theme;
}

