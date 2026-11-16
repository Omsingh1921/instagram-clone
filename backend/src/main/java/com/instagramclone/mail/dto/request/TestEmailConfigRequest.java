package com.instagramclone.mail.dto.request;

import com.instagramclone.common.validation.annotation.TrimValidator;
import com.instagramclone.mail.constants.MailConstants;
import com.instagramclone.mail.enums.EmailCategory;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TrimValidator
public class TestEmailConfigRequest {

    @NotNull(message = MailConstants.VALIDATION_EMAIL_CATEGORY_REQUIRED)
    private EmailCategory category;

    @NotBlank(message = MailConstants.VALIDATION_RECIPIENT_EMAIL_REQUIRED)
    @Email(message = MailConstants.VALIDATION_RECIPIENT_EMAIL_INVALID_MESSAGE)
    private String recipientEmail;
}
