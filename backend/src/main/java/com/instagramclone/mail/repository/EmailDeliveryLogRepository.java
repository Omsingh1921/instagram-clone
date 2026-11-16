package com.instagramclone.mail.repository;

import com.instagramclone.mail.entity.EmailDeliveryLog;
import com.instagramclone.mail.enums.EmailType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmailDeliveryLogRepository extends JpaRepository<EmailDeliveryLog, UUID> {

    List<EmailDeliveryLog> findByUserIdAndEmailTypeOrderByCreatedAtDesc(UUID userId, EmailType emailType);
}
