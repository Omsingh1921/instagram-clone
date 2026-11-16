package com.instagramclone.post.repository;

import com.instagramclone.post.entity.PostMediaTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface PostMediaTagRepository extends JpaRepository<PostMediaTag, UUID> {

    List<PostMediaTag> findByPostMediaId(UUID postMediaId);

    @org.springframework.data.jpa.repository.Query("SELECT t FROM PostMediaTag t JOIN FETCH t.taggedUser u LEFT JOIN FETCH u.profile WHERE t.postMedia.id IN :postMediaIds")
    List<PostMediaTag> findByPostMediaIdIn(@org.springframework.data.repository.query.Param("postMediaIds") Collection<UUID> postMediaIds);

    List<PostMediaTag> findByTaggedUserId(UUID taggedUserId);

    boolean existsByPostMediaIdAndTaggedUserId(UUID postMediaId, UUID taggedUserId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT t.postMedia.post FROM PostMediaTag t WHERE t.taggedUser.id = :userId AND t.postMedia.post.isDeleted = false ORDER BY t.postMedia.post.createdAt DESC")
    org.springframework.data.domain.Page<com.instagramclone.post.entity.Post> findPostsByTaggedUserId(@org.springframework.data.repository.query.Param("userId") UUID userId, org.springframework.data.domain.Pageable pageable);

    void deleteByPostMediaId(UUID postMediaId);
}
