package com.instagramclone.call.repository;

import com.instagramclone.call.entity.CallParticipant;
import com.instagramclone.call.enums.CallParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CallParticipantRepository extends JpaRepository<CallParticipant, UUID> {

    List<CallParticipant> findByCallSessionIdAndStatus(UUID callSessionId, CallParticipantStatus status);

    Optional<CallParticipant> findByCallSessionIdAndUserId(UUID callSessionId, UUID userId);

    @Query("SELECT cp FROM CallParticipant cp JOIN FETCH cp.user WHERE cp.callSession.id = :callSessionId AND cp.status = :status")
    List<CallParticipant> findByCallSessionIdAndStatusWithUser(
            @Param("callSessionId") UUID callSessionId,
            @Param("status") CallParticipantStatus status
    );

    @Query("SELECT COUNT(cp) > 0 FROM CallParticipant cp WHERE cp.callSession.id = :callSessionId AND cp.user.id = :userId AND cp.status = :status")
    boolean existsByCallSessionIdAndUserIdAndStatus(
            @Param("callSessionId") UUID callSessionId,
            @Param("userId") UUID userId,
            @Param("status") CallParticipantStatus status
    );

    @Query("SELECT COUNT(cp) FROM CallParticipant cp WHERE cp.callSession.id = :callSessionId AND cp.status = 'JOINED'")
    long countActiveParticipants(@Param("callSessionId") UUID callSessionId);
}
