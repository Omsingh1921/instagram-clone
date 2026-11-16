package com.instagramclone.chat.repository;

import com.instagramclone.chat.entity.Conversation;
import com.instagramclone.chat.enums.ConversationType;
import com.instagramclone.chat.enums.InboxFolder;
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
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c JOIN c.members m1 JOIN c.members m2 " +
           "WHERE c.type = :type AND m1.user.id = :user1Id AND m2.user.id = :user2Id ORDER BY c.updatedAt DESC")
    List<Conversation> findDirectConversationsBetweenUsers(
            @Param("type") ConversationType type,
            @Param("user1Id") UUID user1Id,
            @Param("user2Id") UUID user2Id
    );

    default Optional<Conversation> findDirectConversationBetweenUsers(ConversationType type, UUID user1Id, UUID user2Id) {
        List<Conversation> list = findDirectConversationsBetweenUsers(type, user1Id, user2Id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    Page<Conversation> findByMembers_User_IdOrderByUpdatedAtDesc(UUID userId, Pageable pageable);

    @Query(value = "SELECT c FROM Conversation c JOIN c.members cm WHERE cm.user.id = :userId ORDER BY cm.isPinned DESC, c.updatedAt DESC",
           countQuery = "SELECT COUNT(c) FROM Conversation c JOIN c.members cm WHERE cm.user.id = :userId")
    Page<Conversation> findConversationsByUserIdWithPinned(@Param("userId") UUID userId, Pageable pageable);

    @Query(value = "SELECT c FROM Conversation c JOIN c.members cm WHERE cm.user.id = :userId AND (cm.folder IS NULL OR cm.folder != com.instagramclone.chat.enums.InboxFolder.REQUESTS) ORDER BY cm.isPinned DESC, c.updatedAt DESC",
           countQuery = "SELECT COUNT(c) FROM Conversation c JOIN c.members cm WHERE cm.user.id = :userId AND (cm.folder IS NULL OR cm.folder != com.instagramclone.chat.enums.InboxFolder.REQUESTS)")
    Page<Conversation> findActiveConversationsByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query(value = "SELECT c FROM Conversation c JOIN c.members cm WHERE cm.user.id = :userId AND cm.folder = :folder ORDER BY cm.isPinned DESC, c.updatedAt DESC",
           countQuery = "SELECT COUNT(c) FROM Conversation c JOIN c.members cm WHERE cm.user.id = :userId AND cm.folder = :folder")
    Page<Conversation> findConversationsByUserIdAndFolder(
            @Param("userId") UUID userId,
            @Param("folder") InboxFolder folder,
            Pageable pageable
    );

    default Page<Conversation> findConversationsByUserId(UUID userId, Pageable pageable) {
        return findConversationsByUserIdWithPinned(userId, pageable);
    }
}
