package com.instagramclone.post.repository;

import com.instagramclone.post.entity.PostNotInterested;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface PostNotInterestedRepository extends JpaRepository<PostNotInterested, UUID> {

    Optional<PostNotInterested> findByUserIdAndPostId(UUID userId, UUID postId);

    boolean existsByUserIdAndPostId(UUID userId, UUID postId);

    void deleteByUserIdAndPostId(UUID userId, UUID postId);

    void deleteByPostId(UUID postId);

    @Query("SELECT pni.post.id FROM PostNotInterested pni WHERE pni.user.id = :userId")
    Set<UUID> findPostIdsByUserId(@Param("userId") UUID userId);
}

