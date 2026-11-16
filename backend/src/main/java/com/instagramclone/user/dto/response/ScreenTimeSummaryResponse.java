package com.instagramclone.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreenTimeSummaryResponse {

    private int daysRequested;
    private int dailyAverageMinutes;
    private int todayMinutes;
    private int breakReminderMinutes;
    private List<DailyScreenTimeItem> dailyBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyScreenTimeItem {
        private LocalDate date;
        private String dayLabel;
        private int minutes;
        private int seconds;
    }
}

