package com.instagramclone.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreenTimeHeartbeatResponse {

    private LocalDate usageDate;
    private int todaySeconds;
    private int todayMinutes;
}

