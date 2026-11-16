package com.instagramclone.device.constants;

/**
 * Domain and validation constants for device registration and push notifications.
 */
public final class DeviceConstants {

    private DeviceConstants() {}

    // Bounds
    public static final int FCM_TOKEN_MIN_LENGTH = 10;
    public static final int FCM_TOKEN_MAX_LENGTH = 512;
    public static final int DEVICE_ID_MAX_LENGTH = 128;
    public static final int USER_AGENT_MAX_LENGTH = 512;

    // Validation Messages
    public static final String VALIDATION_FCM_TOKEN_REQUIRED = "FCM token cannot be blank";
    public static final String VALIDATION_FCM_TOKEN_LENGTH = "FCM token must be between 10 and 512 characters";
    public static final String VALIDATION_FCM_TOKEN_NO_WHITESPACE = "FCM token cannot contain whitespace";
    public static final String VALIDATION_DEVICE_TYPE_REQUIRED = "Device type cannot be null";
    public static final String VALIDATION_DEVICE_ID_MAX_LENGTH = "Device ID cannot exceed 128 characters";
    public static final String VALIDATION_USER_AGENT_MAX_LENGTH = "User agent cannot exceed 512 characters";
}

