package com.instagramclone.device.entity;

import com.instagramclone.common.entity.BaseCreatedEntity;
import com.instagramclone.device.enums.DeviceType;
import com.instagramclone.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "user_devices",
    indexes = {
        @Index(name = "idx_user_devices_token", columnList = "fcm_token"),
        @Index(name = "idx_user_devices_user_id", columnList = "user_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UserDevice extends BaseCreatedEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "fcm_token", nullable = false, length = 512, unique = true)
    private String fcmToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", length = 20, nullable = false)
    @Builder.Default
    private DeviceType deviceType = DeviceType.WEB;

    @Column(name = "device_id", length = 128)
    private String deviceId;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;
}

