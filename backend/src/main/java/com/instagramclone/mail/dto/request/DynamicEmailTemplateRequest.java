package com.instagramclone.mail.dto.request;

import com.instagramclone.common.validation.annotation.TrimValidator;
import com.instagramclone.mail.constants.MailConstants;
import com.instagramclone.mail.enums.EmailType;
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
public class DynamicEmailTemplateRequest {

    @NotNull(message = MailConstants.VALIDATION_EMAIL_TYPE_REQUIRED)
    private EmailType emailType;

    @NotBlank(message = MailConstants.VALIDATION_SUBJECT_TEMPLATE_REQUIRED)
    @Size(max = MailConstants.SUBJECT_TEMPLATE_MAX_LENGTH, message = MailConstants.VALIDATION_SUBJECT_TEMPLATE_MAX_LENGTH_MESSAGE)
    private String subjectTemplate;

    @NotBlank(message = MailConstants.VALIDATION_BODY_HTML_TEMPLATE_REQUIRED)
    private String bodyHtmlTemplate;

    private String bodyTextTemplate;

    @Size(max = MailConstants.TEMPLATE_NAME_MAX_LENGTH, message = MailConstants.VALIDATION_TEMPLATE_NAME_MAX_LENGTH_MESSAGE)
    private String templateName;

    @Size(max = MailConstants.DESCRIPTION_MAX_LENGTH, message = MailConstants.VALIDATION_DESCRIPTION_MAX_LENGTH_MESSAGE)
    private String description;

    @Builder.Default
    private Boolean isActive = true;
}
