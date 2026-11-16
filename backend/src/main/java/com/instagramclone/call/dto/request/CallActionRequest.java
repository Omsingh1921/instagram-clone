package com.instagramclone.call.dto.request;

import com.instagramclone.call.constants.CallConstants;
import com.instagramclone.common.validation.annotation.TrimValidator;
import com.instagramclone.common.validation.annotation.ValidUUID;
import jakarta.validation.constraints.NotNull;
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
public class CallActionRequest {

    @NotNull(message = CallConstants.VALIDATION_CALL_ID_REQUIRED)
    @ValidUUID(required = true, message = CallConstants.VALIDATION_CALL_ID_INVALID_UUID)
    private UUID callId;

    @Size(max = 255, message = CallConstants.VALIDATION_REASON_MAX_LENGTH)
    private String reason;
}
