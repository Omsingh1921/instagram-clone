package com.instagramclone.call.dto;

import com.instagramclone.call.constants.CallConstants;
import com.instagramclone.call.dto.request.CallActionRequest;
import com.instagramclone.call.dto.request.CallSignalRequest;
import com.instagramclone.call.dto.request.InitiateCallRequest;
import com.instagramclone.call.enums.CallType;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CallDtoValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    // ==================== CallActionRequest ====================

    @Test
    @DisplayName("CallActionRequest - Valid callId and reason passes")
    void callActionRequest_Valid() {
        CallActionRequest request = CallActionRequest.builder()
                .callId(UUID.randomUUID())
                .reason("User ended call")
                .build();

        Set<ConstraintViolation<CallActionRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("CallActionRequest - Null callId fails validation")
    void callActionRequest_NullCallId_Fails() {
        CallActionRequest request = CallActionRequest.builder()
                .reason("User ended call")
                .build();

        Set<ConstraintViolation<CallActionRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("callId")
                && (v.getMessage().equals(CallConstants.VALIDATION_CALL_ID_REQUIRED)
                || v.getMessage().equals(CallConstants.VALIDATION_CALL_ID_INVALID_UUID)));
    }

    @Test
    @DisplayName("CallActionRequest - Reason exceeding 255 chars fails validation")
    void callActionRequest_ReasonTooLong_Fails() {
        CallActionRequest request = CallActionRequest.builder()
                .callId(UUID.randomUUID())
                .reason("a".repeat(256))
                .build();

        Set<ConstraintViolation<CallActionRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("reason")
                && v.getMessage().equals(CallConstants.VALIDATION_REASON_MAX_LENGTH));
    }

    // ==================== CallSignalRequest ====================

    @Test
    @DisplayName("CallSignalRequest - Valid fields pass validation")
    void callSignalRequest_Valid() {
        CallSignalRequest request = CallSignalRequest.builder()
                .callId(UUID.randomUUID())
                .recipientId(UUID.randomUUID())
                .signalType("offer")
                .data("{\"sdp\":\"test-sdp\"}")
                .build();

        Set<ConstraintViolation<CallSignalRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"offer", "answer", "ice-candidate", "candidate", "OFFER", "Answer"})
    @DisplayName("CallSignalRequest - Valid signal types pass pattern validation")
    void callSignalRequest_ValidSignalTypes(String signalType) {
        CallSignalRequest request = CallSignalRequest.builder()
                .callId(UUID.randomUUID())
                .recipientId(UUID.randomUUID())
                .signalType(signalType)
                .data(new Object())
                .build();

        Set<ConstraintViolation<CallSignalRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("CallSignalRequest - Null callId and recipientId fail validation")
    void callSignalRequest_MissingUuids_Fails() {
        CallSignalRequest request = CallSignalRequest.builder()
                .signalType("offer")
                .data("{\"sdp\":\"test-sdp\"}")
                .build();

        Set<ConstraintViolation<CallSignalRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("callId"));
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("recipientId"));
    }

    @Test
    @DisplayName("CallSignalRequest - Invalid signalType pattern fails validation")
    void callSignalRequest_InvalidSignalType_Fails() {
        CallSignalRequest request = CallSignalRequest.builder()
                .callId(UUID.randomUUID())
                .recipientId(UUID.randomUUID())
                .signalType("invalid-type")
                .data("{\"sdp\":\"test-sdp\"}")
                .build();

        Set<ConstraintViolation<CallSignalRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("signalType")
                && v.getMessage().equals(CallConstants.VALIDATION_SIGNAL_TYPE_PATTERN));
    }

    @Test
    @DisplayName("CallSignalRequest - Null data payload fails validation")
    void callSignalRequest_NullData_Fails() {
        CallSignalRequest request = CallSignalRequest.builder()
                .callId(UUID.randomUUID())
                .recipientId(UUID.randomUUID())
                .signalType("offer")
                .data(null)
                .build();

        Set<ConstraintViolation<CallSignalRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("data")
                && v.getMessage().equals(CallConstants.VALIDATION_SIGNAL_DATA_REQUIRED));
    }

    // ==================== InitiateCallRequest ====================

    @Test
    @DisplayName("InitiateCallRequest - Valid fields without conversationId pass")
    void initiateCallRequest_ValidWithoutConversationId() {
        InitiateCallRequest request = InitiateCallRequest.builder()
                .recipientId(UUID.randomUUID())
                .callType(CallType.VIDEO)
                .build();

        Set<ConstraintViolation<InitiateCallRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("InitiateCallRequest - Valid fields with conversationId pass")
    void initiateCallRequest_ValidWithConversationId() {
        InitiateCallRequest request = InitiateCallRequest.builder()
                .recipientId(UUID.randomUUID())
                .conversationId(UUID.randomUUID())
                .callType(CallType.AUDIO)
                .build();

        Set<ConstraintViolation<InitiateCallRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("InitiateCallRequest - Missing recipientId fails validation")
    void initiateCallRequest_NullRecipientId_Fails() {
        InitiateCallRequest request = InitiateCallRequest.builder()
                .callType(CallType.AUDIO)
                .build();

        Set<ConstraintViolation<InitiateCallRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("recipientId"));
    }

    @Test
    @DisplayName("InitiateCallRequest - Missing callType fails validation")
    void initiateCallRequest_NullCallType_Fails() {
        InitiateCallRequest request = InitiateCallRequest.builder()
                .recipientId(UUID.randomUUID())
                .build();

        Set<ConstraintViolation<InitiateCallRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("callType")
                && v.getMessage().equals(CallConstants.VALIDATION_CALL_TYPE_REQUIRED));
    }
}

