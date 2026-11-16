package com.instagramclone.call.dto.request;

import com.instagramclone.call.constants.CallConstants;
import com.instagramclone.common.validation.annotation.TrimValidator;
import com.instagramclone.common.validation.annotation.ValidUUID;
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
public class CallSignalRequest {

    @NotNull(message = CallConstants.VALIDATION_CALL_ID_REQUIRED)
    @ValidUUID(required = true, message = CallConstants.VALIDATION_CALL_ID_INVALID_UUID)
    private UUID callId;

    @NotNull(message = CallConstants.VALIDATION_RECIPIENT_ID_REQUIRED)
    @ValidUUID(required = true, message = CallConstants.VALIDATION_RECIPIENT_ID_INVALID_UUID)
    private UUID recipientId;

    @NotBlank(message = CallConstants.VALIDATION_SIGNAL_TYPE_REQUIRED)
    @Size(max = 30, message = CallConstants.VALIDATION_SIGNAL_TYPE_MAX_LENGTH)
    @Pattern(
        regexp = "^(?i)(offer|answer|ice-candidate|candidate)$",
        message = CallConstants.VALIDATION_SIGNAL_TYPE_PATTERN
    )
    private String signalType; // "offer", "answer", "ice-candidate"

    @NotNull(message = CallConstants.VALIDATION_SIGNAL_DATA_REQUIRED)
    private Object data; // SDP payload or ICE candidate object
}
