package com.instagramclone.mail.dto.request;

import com.instagramclone.mail.constants.MailConstants;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateEmailServerConfigRequest {

    @NotBlank(message = MailConstants.VALIDATION_PROVIDER_NAME_REQUIRED)
    private String providerName;

    @NotBlank(message = MailConstants.VALIDATION_SMTP_HOST_REQUIRED)
    private String host;

    @NotNull(message = MailConstants.VALIDATION_SMTP_PORT_REQUIRED)
    @Min(value = MailConstants.SMTP_PORT_MIN, message = MailConstants.VALIDATION_SMTP_PORT_MIN_MESSAGE)
    @Max(value = MailConstants.SMTP_PORT_MAX, message = MailConstants.VALIDATION_SMTP_PORT_MAX_MESSAGE)
    private Integer port;

    private String username;

    private String password;

    @NotNull(message = MailConstants.VALIDATION_AUTH_ENABLED_REQUIRED)
    private Boolean authEnabled;

    @NotNull(message = MailConstants.VALIDATION_STARTTLS_ENABLED_REQUIRED)
    private Boolean starttlsEnabled;

    @NotNull(message = MailConstants.VALIDATION_SSL_ENABLED_REQUIRED)
    private Boolean sslEnabled;

    @NotNull(message = MailConstants.VALIDATION_CONNECTION_TIMEOUT_REQUIRED)
    @Min(value = MailConstants.CONNECTION_TIMEOUT_MS_MIN, message = MailConstants.VALIDATION_CONNECTION_TIMEOUT_MIN_MESSAGE)
    private Integer connectionTimeoutMs;

    @NotNull(message = MailConstants.VALIDATION_SIMULATION_MODE_REQUIRED)
    private Boolean simulationMode;

    @NotNull(message = MailConstants.VALIDATION_RATE_LIMIT_PER_HOUR_REQUIRED)
    @Min(value = MailConstants.RATE_LIMIT_PER_HOUR_MIN, message = MailConstants.VALIDATION_RATE_LIMIT_MIN_MESSAGE)
    private Integer rateLimitPerHour;
}
