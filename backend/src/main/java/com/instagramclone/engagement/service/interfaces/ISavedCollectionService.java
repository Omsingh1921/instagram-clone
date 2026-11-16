package com.instagramclone.engagement.service.interfaces;

import com.instagramclone.common.response.PageResponse;
import com.instagramclone.engagement.dto.request.CreateCollectionRequest;
import com.instagramclone.engagement.dto.response.CollectionResponse;
import com.instagramclone.post.dto.response.PostResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ISavedCollectionService {
    CollectionResponse createCollection(CreateCollectionRequest request);
    List<CollectionResponse> getUserCollections();
    PageResponse<PostResponse> getCollectionPosts(UUID collectionId, Pageable pageable);
    void addItemToCollection(UUID collectionId, UUID postId, UUID reelId);
    void removeItemFromCollection(UUID collectionId, UUID postId, UUID reelId);
    void deleteCollection(UUID collectionId);
    CollectionResponse updateCollection(UUID collectionId, com.instagramclone.engagement.dto.request.UpdateCollectionRequest request);
    PageResponse<com.instagramclone.reel.dto.response.ReelResponse> getCollectionReels(UUID collectionId, Pageable pageable);
}
