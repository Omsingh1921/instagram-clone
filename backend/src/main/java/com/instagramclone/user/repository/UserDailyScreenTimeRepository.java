package com.instagramclone.user.repository;

import com.instagramclone.user.entity.UserDailyScreenTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserDailyScreenTimeRepository extends JpaRepository<UserDailyScreenTime, UUID> {

    Optional<UserDailyScreenTime> findByUserIdAndUsageDate(UUID userId, LocalDate usageDate);

    List<UserDailyScreenTime> findByUserIdAndUsageDateBetweenOrderByUsageDateAsc(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE UserDailyScreenTime s " +
            "SET s.activeSeconds = s.activeSeconds + :deltaSeconds, s.updatedAt = :updatedAt " +
            "WHERE s.user.id = :userId AND s.usageDate = :usageDate")
    int incrementActiveSeconds(
            @Param("userId") UUID userId,
            @Param("usageDate") LocalDate usageDate,
            @Param("deltaSeconds") int deltaSeconds,
            @Param("updatedAt") LocalDateTime updatedAt
    );
}

