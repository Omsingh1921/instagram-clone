package com.instagramclone.device.dto.response;

import com.instagramclone.device.enums.DeviceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceResponse {
    private UUID id;
    private String fcmToken;
    private DeviceType deviceType;
    private String deviceId;
    private String userAgent;
    private LocalDateTime lastActiveAt;
    private LocalDateTime createdAt;
}

