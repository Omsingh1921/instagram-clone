package com.instagramclone.call.repository;

import com.instagramclone.call.entity.CallSession;
import com.instagramclone.call.enums.CallStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CallSessionRepository extends JpaRepository<CallSession, UUID> {

    @Query("SELECT c FROM CallSession c WHERE c.caller.id = :userId OR (c.recipient IS NOT NULL AND c.recipient.id = :userId) ORDER BY c.startedAt DESC")
    Page<CallSession> findAllUserCalls(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT c FROM CallSession c WHERE (c.caller.id = :userId OR (c.recipient IS NOT NULL AND c.recipient.id = :userId)) AND c.status IN (:statuses)")
    List<CallSession> findActiveCallsByUserId(@Param("userId") UUID userId, @Param("statuses") List<CallStatus> statuses);

    @Query("SELECT c FROM CallSession c WHERE c.conversationId = :conversationId ORDER BY c.startedAt DESC")
    Page<CallSession> findByConversationId(@Param("conversationId") UUID conversationId, Pageable pageable);

    @Query("SELECT c FROM CallSession c WHERE c.conversationId = :conversationId AND c.isGroup = true AND c.status IN (:statuses) ORDER BY c.startedAt DESC")
    List<CallSession> findActiveGroupCallsByConversationId(
            @Param("conversationId") UUID conversationId,
            @Param("statuses") List<CallStatus> statuses
    );
}

