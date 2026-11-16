package com.instagramclone.engagement.controller;

import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.engagement.dto.request.CreateCollectionRequest;
import com.instagramclone.engagement.dto.response.CollectionResponse;
import com.instagramclone.engagement.service.interfaces.ISavedCollectionService;
import com.instagramclone.post.dto.response.PostResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/collections")
@RequiredArgsConstructor
public class SavedCollectionController {

    private final ISavedCollectionService collectionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CollectionResponse>>> getUserCollections() {
        List<CollectionResponse> collections = collectionService.getUserCollections();
        return ResponseEntity.ok(ApiResponse.success("Collections retrieved successfully", collections));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CollectionResponse>> createCollection(@Valid @RequestBody CreateCollectionRequest request) {
        CollectionResponse response = collectionService.createCollection(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Collection created successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CollectionResponse>> updateCollection(
            @PathVariable UUID id,
            @Valid @RequestBody com.instagramclone.engagement.dto.request.UpdateCollectionRequest request) {
        CollectionResponse response = collectionService.updateCollection(id, request);
        return ResponseEntity.ok(ApiResponse.success("Collection updated successfully", response));
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getCollectionPosts(
            @PathVariable UUID id,
            @PageableDefault(size = 18) Pageable pageable) {
        PageResponse<PostResponse> posts = collectionService.getCollectionPosts(id, pageable);
        return ResponseEntity.ok(ApiResponse.success("Collection posts retrieved successfully", posts));
    }

    @GetMapping("/{id}/reels")
    public ResponseEntity<ApiResponse<PageResponse<com.instagramclone.reel.dto.response.ReelResponse>>> getCollectionReels(
            @PathVariable UUID id,
            @PageableDefault(size = 18) Pageable pageable) {
        PageResponse<com.instagramclone.reel.dto.response.ReelResponse> reels = collectionService.getCollectionReels(id, pageable);
        return ResponseEntity.ok(ApiResponse.success("Collection reels retrieved successfully", reels));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<ApiResponse<Void>> addItemToCollection(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID postId,
            @RequestParam(required = false) UUID reelId) {
        collectionService.addItemToCollection(id, postId, reelId);
        return ResponseEntity.ok(ApiResponse.success("Item added to collection", null));
    }

    @DeleteMapping("/{id}/items")
    public ResponseEntity<ApiResponse<Void>> removeItemFromCollection(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID postId,
            @RequestParam(required = false) UUID reelId) {
        collectionService.removeItemFromCollection(id, postId, reelId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from collection", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCollection(@PathVariable UUID id) {
        collectionService.deleteCollection(id);
        return ResponseEntity.ok(ApiResponse.success("Collection deleted successfully", null));
    }
}
