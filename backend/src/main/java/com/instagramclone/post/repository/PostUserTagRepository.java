package com.instagramclone.post.repository;

import com.instagramclone.post.entity.PostUserTag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostUserTagRepository extends JpaRepository<PostUserTag, UUID> {

    List<PostUserTag> findByPostId(UUID postId);

    @Query("SELECT t.post FROM PostUserTag t WHERE t.user.id = :userId ORDER BY t.post.createdAt DESC")
    Page<com.instagramclone.post.entity.Post> findPostsByTaggedUserId(@Param("userId") UUID userId, Pageable pageable);

    void deleteByPostId(UUID postId);
}
