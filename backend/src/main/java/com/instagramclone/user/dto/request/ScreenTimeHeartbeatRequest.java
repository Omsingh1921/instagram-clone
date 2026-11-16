package com.instagramclone.user.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreenTimeHeartbeatRequest {

    @NotNull(message = "Active seconds is required")
    @Min(value = 1, message = "Active seconds must be at least 1")
    @Max(value = 120, message = "Active seconds cannot exceed 120 per heartbeat")
    private Integer activeSeconds;

    private LocalDate usageDate;
}

