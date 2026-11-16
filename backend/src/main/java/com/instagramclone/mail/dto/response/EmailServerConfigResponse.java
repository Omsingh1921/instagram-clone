package com.instagramclone.mail.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailServerConfigResponse {

    private UUID id;
    private String providerName;
    private String host;
    private Integer port;
    private String username;
    private boolean hasPassword;
    private String maskedPassword;
    private Boolean authEnabled;
    private Boolean starttlsEnabled;
    private Boolean sslEnabled;
    private Integer connectionTimeoutMs;
    private Boolean simulationMode;
    private Integer rateLimitPerHour;
    private LocalDateTime updatedAt;
}
