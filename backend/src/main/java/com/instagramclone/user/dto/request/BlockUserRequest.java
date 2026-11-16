package com.instagramclone.user.dto.request;

import com.instagramclone.user.enums.BlockReason;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockUserRequest {

    @Builder.Default
    private BlockReason reason = BlockReason.NOT_SPECIFIED;

    @Builder.Default
    private Boolean blockFutureAccounts = true;

    @Size(max = 255, message = "Notes cannot exceed 255 characters")
    private String notes;
}

