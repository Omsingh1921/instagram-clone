package com.instagramclone.call.dto.request;

import com.instagramclone.call.constants.CallConstants;
import com.instagramclone.call.enums.CallType;
import com.instagramclone.common.validation.annotation.TrimValidator;
import com.instagramclone.common.validation.annotation.ValidUUID;
import jakarta.validation.constraints.NotNull;
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
public class InitiateCallRequest {

    @NotNull(message = CallConstants.VALIDATION_RECIPIENT_ID_REQUIRED)
    @ValidUUID(required = true, message = CallConstants.VALIDATION_RECIPIENT_ID_INVALID_UUID)
    private UUID recipientId;

    @ValidUUID(required = false, message = CallConstants.VALIDATION_CONVERSATION_ID_INVALID_UUID)
    private UUID conversationId;

    @NotNull(message = CallConstants.VALIDATION_CALL_TYPE_REQUIRED)
    private CallType callType;

    private Boolean isGroup;
}
