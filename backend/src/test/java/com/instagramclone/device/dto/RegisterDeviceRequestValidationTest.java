package com.instagramclone.device.dto;

import com.instagramclone.device.constants.DeviceConstants;
import com.instagramclone.device.dto.request.RegisterDeviceRequest;
import com.instagramclone.device.enums.DeviceType;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RegisterDeviceRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("RegisterDeviceRequest - Valid request passes validation")
    void validRequest_ShouldPass() {
        RegisterDeviceRequest request = RegisterDeviceRequest.builder()
                .fcmToken("fcm_valid_token_1234567890")
                .deviceType(DeviceType.WEB)
                .deviceId("browser_device_01")
                .userAgent("Mozilla/5.0")
                .build();

        Set<ConstraintViolation<RegisterDeviceRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t", "\n"})
    @DisplayName("RegisterDeviceRequest - Null or blank fcmToken fails validation")
    void blankFcmToken_ShouldFail(String token) {
        RegisterDeviceRequest request = RegisterDeviceRequest.builder()
                .fcmToken(token)
                .deviceType(DeviceType.WEB)
                .build();

        Set<ConstraintViolation<RegisterDeviceRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("fcmToken"));
    }

    @Test
    @DisplayName("RegisterDeviceRequest - fcmToken shorter than 10 chars fails validation")
    void shortFcmToken_ShouldFail() {
        RegisterDeviceRequest request = RegisterDeviceRequest.builder()
                .fcmToken("short_tok")
                .deviceType(DeviceType.WEB)
                .build();

        Set<ConstraintViolation<RegisterDeviceRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("fcmToken")
                && v.getMessage().equals(DeviceConstants.VALIDATION_FCM_TOKEN_LENGTH));
    }

    @Test
    @DisplayName("RegisterDeviceRequest - fcmToken exceeding 512 chars fails validation")
    void longFcmToken_ShouldFail() {
        RegisterDeviceRequest request = RegisterDeviceRequest.builder()
                .fcmToken("a".repeat(513))
                .deviceType(DeviceType.WEB)
                .build();

        Set<ConstraintViolation<RegisterDeviceRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("fcmToken")
                && v.getMessage().equals(DeviceConstants.VALIDATION_FCM_TOKEN_LENGTH));
    }

    @Test
    @DisplayName("RegisterDeviceRequest - fcmToken with embedded whitespace fails validation")
    void fcmTokenWithWhitespace_ShouldFail() {
        RegisterDeviceRequest request = RegisterDeviceRequest.builder()
                .fcmToken("token with spaces 123456789")
                .deviceType(DeviceType.WEB)
                .build();

        Set<ConstraintViolation<RegisterDeviceRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("fcmToken")
                && v.getMessage().equals(DeviceConstants.VALIDATION_FCM_TOKEN_NO_WHITESPACE));
    }

    @Test
    @DisplayName("RegisterDeviceRequest - Null deviceType fails validation")
    void nullDeviceType_ShouldFail() {
        RegisterDeviceRequest request = RegisterDeviceRequest.builder()
                .fcmToken("fcm_valid_token_1234567890")
                .deviceType(null)
                .build();

        Set<ConstraintViolation<RegisterDeviceRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("deviceType")
                && v.getMessage().equals(DeviceConstants.VALIDATION_DEVICE_TYPE_REQUIRED));
    }

    @Test
    @DisplayName("RegisterDeviceRequest - deviceId exceeding 128 chars fails validation")
    void longDeviceId_ShouldFail() {
        RegisterDeviceRequest request = RegisterDeviceRequest.builder()
                .fcmToken("fcm_valid_token_1234567890")
                .deviceType(DeviceType.WEB)
                .deviceId("d".repeat(129))
                .build();

        Set<ConstraintViolation<RegisterDeviceRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("deviceId")
                && v.getMessage().equals(DeviceConstants.VALIDATION_DEVICE_ID_MAX_LENGTH));
    }

    @Test
    @DisplayName("RegisterDeviceRequest - userAgent exceeding 512 chars fails validation")
    void longUserAgent_ShouldFail() {
        RegisterDeviceRequest request = RegisterDeviceRequest.builder()
                .fcmToken("fcm_valid_token_1234567890")
                .deviceType(DeviceType.WEB)
                .userAgent("u".repeat(513))
                .build();

        Set<ConstraintViolation<RegisterDeviceRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("userAgent")
                && v.getMessage().equals(DeviceConstants.VALIDATION_USER_AGENT_MAX_LENGTH));
    }
}

