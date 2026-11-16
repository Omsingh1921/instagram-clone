package com.instagramclone.mail.dto.request;

import com.instagramclone.common.validation.annotation.TrimValidator;
import com.instagramclone.mail.constants.MailConstants;
import com.instagramclone.mail.enums.EmailCategory;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TrimValidator
public class DynamicEmailConfigRequest {

    @NotNull(message = MailConstants.VALIDATION_EMAIL_CATEGORY_REQUIRED)
    private EmailCategory category;

    @NotBlank(message = MailConstants.VALIDATION_FROM_EMAIL_REQUIRED)
    @Email(message = MailConstants.VALIDATION_FROM_EMAIL_INVALID_MESSAGE)
    @Size(max = MailConstants.EMAIL_FIELD_MAX_LENGTH, message = MailConstants.VALIDATION_FROM_EMAIL_MAX_LENGTH_MESSAGE)
    private String fromEmail;

    @NotBlank(message = MailConstants.VALIDATION_SENDER_NAME_REQUIRED)
    @Size(max = MailConstants.SENDER_NAME_MAX_LENGTH, message = MailConstants.VALIDATION_SENDER_NAME_MAX_LENGTH_MESSAGE)
    private String senderName;

    @Size(max = MailConstants.PURPOSE_NAME_MAX_LENGTH, message = MailConstants.VALIDATION_PURPOSE_NAME_MAX_LENGTH_MESSAGE)
    private String purposeName;

    @Size(max = MailConstants.DESCRIPTION_MAX_LENGTH, message = MailConstants.VALIDATION_DESCRIPTION_MAX_LENGTH_MESSAGE)
    private String description;

    @Email(message = MailConstants.VALIDATION_REPLY_TO_INVALID_MESSAGE)
    @Size(max = MailConstants.EMAIL_FIELD_MAX_LENGTH, message = MailConstants.VALIDATION_REPLY_TO_MAX_LENGTH_MESSAGE)
    private String replyTo;

    @Builder.Default
    private Boolean isEnabled = true;
}
