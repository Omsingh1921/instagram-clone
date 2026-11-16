package com.instagramclone.engagement.service.impl;

import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.engagement.dto.request.CreateCollectionRequest;
import com.instagramclone.engagement.dto.response.CollectionResponse;
import com.instagramclone.engagement.entity.SavedCollection;
import com.instagramclone.engagement.entity.SavedCollectionItem;
import com.instagramclone.engagement.repository.SavedCollectionItemRepository;
import com.instagramclone.engagement.repository.SavedCollectionRepository;
import com.instagramclone.engagement.service.interfaces.ISavedCollectionService;
import com.instagramclone.post.dto.response.PostResponse;
import com.instagramclone.post.entity.Post;
import com.instagramclone.post.repository.PostRepository;
import com.instagramclone.post.service.interfaces.IPostService;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.repository.ReelRepository;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SavedCollectionServiceImpl implements ISavedCollectionService {

    private final SavedCollectionRepository collectionRepository;
    private final SavedCollectionItemRepository itemRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ReelRepository reelRepository;
    private final IPostService postService;
    private final com.instagramclone.reel.service.interfaces.IReelService reelService;

    @Override
    @Transactional
    public CollectionResponse createCollection(CreateCollectionRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserId));

        SavedCollection collection = SavedCollection.builder()
                .user(user)
                .name(request.getName().trim())
                .coverMediaUrl(request.getCoverMediaUrl())
                .build();

        SavedCollection saved = collectionRepository.save(collection);

        if (request.getInitialPostIds() != null && !request.getInitialPostIds().isEmpty()) {
            for (UUID postId : request.getInitialPostIds()) {
                postRepository.findById(postId).ifPresent(post -> {
                    SavedCollectionItem item = SavedCollectionItem.builder()
                            .collection(saved)
                            .post(post)
                            .build();
                    itemRepository.save(item);
                });
            }
        }

        return toCollectionResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CollectionResponse> getUserCollections() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        List<SavedCollection> collections = collectionRepository.findByUserIdOrderByUpdatedAtDesc(currentUserId);
        return collections.stream().map(this::toCollectionResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getCollectionPosts(UUID collectionId, Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        SavedCollection collection = collectionRepository.findByIdAndUserId(collectionId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + collectionId));

        Page<SavedCollectionItem> itemsPage = itemRepository.findByCollectionIdAndPostIsNotNullOrderByCreatedAtDesc(collection.getId(), pageable);
        List<PostResponse> postResponses = itemsPage.getContent().stream()
                .map(item -> {
                    try {
                        if (item.getPost() != null) {
                            return postService.getPostById(item.getPost().getId());
                        }
                    } catch (Exception ignored) {}
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return PageResponse.<PostResponse>builder()
                .content(postResponses)
                .pageNumber(itemsPage.getNumber())
                .pageSize(itemsPage.getSize())
                .totalElements(itemsPage.getTotalElements())
                .totalPages(itemsPage.getTotalPages())
                .last(itemsPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<com.instagramclone.reel.dto.response.ReelResponse> getCollectionReels(UUID collectionId, Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        SavedCollection collection = collectionRepository.findByIdAndUserId(collectionId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + collectionId));

        Page<SavedCollectionItem> itemsPage = itemRepository.findByCollectionIdAndReelIsNotNullOrderByCreatedAtDesc(collection.getId(), pageable);
        List<com.instagramclone.reel.dto.response.ReelResponse> reelResponses = itemsPage.getContent().stream()
                .map(item -> {
                    try {
                        if (item.getReel() != null) {
                            return reelService.getReelById(item.getReel().getId());
                        }
                    } catch (Exception ignored) {}
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return PageResponse.<com.instagramclone.reel.dto.response.ReelResponse>builder()
                .content(reelResponses)
                .pageNumber(itemsPage.getNumber())
                .pageSize(itemsPage.getSize())
                .totalElements(itemsPage.getTotalElements())
                .totalPages(itemsPage.getTotalPages())
                .last(itemsPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public void addItemToCollection(UUID collectionId, UUID postId, UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        SavedCollection collection = collectionRepository.findByIdAndUserId(collectionId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + collectionId));

        if (postId == null && reelId == null) {
            throw new BadRequestException("Either postId or reelId must be provided");
        }

        if (postId != null) {
            if (!itemRepository.existsByCollectionIdAndPostId(collectionId, postId)) {
                Post post = postRepository.findById(postId)
                        .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));
                itemRepository.save(SavedCollectionItem.builder().collection(collection).post(post).build());
                if (collection.getCoverMediaUrl() == null && !post.getMediaList().isEmpty()) {
                    collection.setCoverMediaUrl(post.getMediaList().get(0).getMediaUrl());
                    collectionRepository.save(collection);
                }
            }
        } else {
            if (!itemRepository.existsByCollectionIdAndReelId(collectionId, reelId)) {
                Reel reel = reelRepository.findById(reelId)
                        .orElseThrow(() -> new ResourceNotFoundException("Reel not found: " + reelId));
                itemRepository.save(SavedCollectionItem.builder().collection(collection).reel(reel).build());
                if (collection.getCoverMediaUrl() == null) {
                    collection.setCoverMediaUrl(reel.getThumbnailUrl() != null ? reel.getThumbnailUrl() : reel.getVideoUrl());
                    collectionRepository.save(collection);
                }
            }
        }
    }

    @Override
    @Transactional
    public void removeItemFromCollection(UUID collectionId, UUID postId, UUID reelId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        SavedCollection collection = collectionRepository.findByIdAndUserId(collectionId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + collectionId));

        if (postId != null) {
            itemRepository.findByCollectionIdAndPostId(collectionId, postId).ifPresent(itemRepository::delete);
        } else if (reelId != null) {
            itemRepository.findByCollectionIdAndReelId(collectionId, reelId).ifPresent(itemRepository::delete);
        }
    }

    @Override
    @Transactional
    public void deleteCollection(UUID collectionId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        SavedCollection collection = collectionRepository.findByIdAndUserId(collectionId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + collectionId));
        collectionRepository.delete(collection);
    }

    @Override
    @Transactional
    public CollectionResponse updateCollection(UUID collectionId, com.instagramclone.engagement.dto.request.UpdateCollectionRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        SavedCollection collection = collectionRepository.findByIdAndUserId(collectionId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + collectionId));

        if (request.getName() != null && !request.getName().isBlank()) {
            collection.setName(request.getName().trim());
        }
        if (request.getCoverMediaUrl() != null) {
            collection.setCoverMediaUrl(request.getCoverMediaUrl().trim());
        }

        SavedCollection saved = collectionRepository.save(collection);
        log.info("Collection {} updated by user {}", collectionId, currentUserId);
        return toCollectionResponse(saved);
    }

    private CollectionResponse toCollectionResponse(SavedCollection collection) {
        long count = itemRepository.countByCollectionId(collection.getId());
        Page<SavedCollectionItem> topItems = itemRepository.findByCollectionIdOrderByCreatedAtDesc(
                collection.getId(), PageRequest.of(0, 4)
        );

        List<String> previews = new ArrayList<>();
        for (SavedCollectionItem item : topItems.getContent()) {
            if (item.getPost() != null && item.getPost().getMediaList() != null && !item.getPost().getMediaList().isEmpty()) {
                previews.add(item.getPost().getMediaList().get(0).getMediaUrl());
            } else if (item.getReel() != null) {
                previews.add(item.getReel().getThumbnailUrl() != null ? item.getReel().getThumbnailUrl() : item.getReel().getVideoUrl());
            }
        }

        String cover = collection.getCoverMediaUrl();
        if ((cover == null || cover.isBlank()) && !previews.isEmpty()) {
            cover = previews.get(0);
        }

        return CollectionResponse.builder()
                .id(collection.getId())
                .name(collection.getName())
                .coverMediaUrl(cover)
                .itemCount(count)
                .previewMediaUrls(previews)
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .build();
    }
}
