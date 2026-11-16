package com.instagramclone.device.dto.request;

import com.instagramclone.common.validation.annotation.TrimValidator;
import com.instagramclone.device.constants.DeviceConstants;
import com.instagramclone.device.enums.DeviceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
public class RegisterDeviceRequest {

    @NotBlank(message = DeviceConstants.VALIDATION_FCM_TOKEN_REQUIRED)
    @Size(min = DeviceConstants.FCM_TOKEN_MIN_LENGTH, max = DeviceConstants.FCM_TOKEN_MAX_LENGTH,
          message = DeviceConstants.VALIDATION_FCM_TOKEN_LENGTH)
    @Pattern(regexp = "^\\S+$", message = DeviceConstants.VALIDATION_FCM_TOKEN_NO_WHITESPACE)
    private String fcmToken;

    @NotNull(message = DeviceConstants.VALIDATION_DEVICE_TYPE_REQUIRED)
    @Builder.Default
    private DeviceType deviceType = DeviceType.WEB;

    @Size(max = DeviceConstants.DEVICE_ID_MAX_LENGTH, message = DeviceConstants.VALIDATION_DEVICE_ID_MAX_LENGTH)
    private String deviceId;

    @Size(max = DeviceConstants.USER_AGENT_MAX_LENGTH, message = DeviceConstants.VALIDATION_USER_AGENT_MAX_LENGTH)
    private String userAgent;
}
