package com.instagramclone.chat.dto.request;

import com.instagramclone.common.constants.ValidationConstants;
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
public class EditMessageRequest {

    @NotBlank(message = "Message content cannot be blank")
    @Size(max = ValidationConstants.MESSAGE_CONTENT_MAX_LENGTH, message = ValidationConstants.MESSAGE_CONTENT_MAX_LENGTH_MESSAGE)
    private String content;
}

