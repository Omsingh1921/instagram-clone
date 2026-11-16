package com.instagramclone.mail.entity;

import com.instagramclone.common.entity.BaseAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "dynamic_email_server_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DynamicEmailServerConfig extends BaseAuditableEntity {

    @Column(name = "provider_name", nullable = false, length = 50)
    @Builder.Default
    private String providerName = "SMTP";

    @Column(name = "host", nullable = false, length = 255)
    @Builder.Default
    private String host = "smtp.gmail.com";

    @Column(name = "port", nullable = false)
    @Builder.Default
    private Integer port = 587;

    @Column(name = "username", length = 255)
    private String username;

    @Column(name = "password", length = 255)
    private String password;

    @Column(name = "auth_enabled", nullable = false)
    @Builder.Default
    private Boolean authEnabled = true;

    @Column(name = "starttls_enabled", nullable = false)
    @Builder.Default
    private Boolean starttlsEnabled = true;

    @Column(name = "ssl_enabled", nullable = false)
    @Builder.Default
    private Boolean sslEnabled = false;

    @Column(name = "connection_timeout_ms", nullable = false)
    @Builder.Default
    private Integer connectionTimeoutMs = 10000;

    @Column(name = "simulation_mode", nullable = false)
    @Builder.Default
    private Boolean simulationMode = true;

    @Column(name = "rate_limit_per_hour", nullable = false)
    @Builder.Default
    private Integer rateLimitPerHour = 1000;
}
