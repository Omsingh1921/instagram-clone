package com.instagramclone.auth.dto.request;

import com.instagramclone.common.constants.ValidationConstants;
import com.instagramclone.common.validation.annotation.TrimValidator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TrimValidator
public class ResetPasswordWithTicketRequest {

    @NotBlank(message = ValidationConstants.RESET_TICKET_REQUIRED)
    @Size(max = ValidationConstants.TOKEN_MAX_LENGTH, message = ValidationConstants.RESET_TICKET_MAX_LENGTH_MESSAGE)
    private String resetTicket;

    @NotNull(message = ValidationConstants.TARGET_USER_ID_REQUIRED)
    private UUID userId;

    @NotBlank(message = ValidationConstants.NEW_PASSWORD_REQUIRED)
    @Size(min = ValidationConstants.PASSWORD_MIN_LENGTH, max = ValidationConstants.PASSWORD_MAX_LENGTH, message = ValidationConstants.PASSWORD_LENGTH_RANGE_MESSAGE)
    @Pattern(
        regexp = ValidationConstants.PASSWORD_REGEX,
        message = ValidationConstants.PASSWORD_PATTERN_MESSAGE
    )
    private String newPassword;
}
