package com.instagramclone.feed.service.impl;

import com.instagramclone.common.event.DomainEvent;
import com.instagramclone.feed.constants.FeedConstants;
import com.instagramclone.feed.service.interfaces.IUserAffinityService;
import com.instagramclone.post.entity.Post;
import com.instagramclone.post.repository.PostRepository;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.repository.ReelRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Listens asynchronously to user engagement domain events and updates
 * affinity vectors and topic interest models in Redis.
 */
@Component
@RequiredArgsConstructor
public class FeedInteractionEventListener {

    private static final Logger log = LoggerFactory.getLogger(FeedInteractionEventListener.class);
    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#([A-Za-z0-9_]+)");

    private final IUserAffinityService userAffinityService;
    private final PostRepository postRepository;
    private final ReelRepository reelRepository;

    @Async
    @EventListener
    public void onDomainEvent(DomainEvent event) {
        if (event == null || event.getEventType() == null || event.getActorId() == null) {
            return;
        }

        String eventType = event.getEventType().toUpperCase();
        UUID viewerId = event.getActorId();
        UUID targetId = event.getTargetId();

        try {
            if (eventType.startsWith(FeedConstants.EVENT_PREFIX_POST)) {
                handlePostInteraction(viewerId, targetId, eventType);
            } else if (eventType.startsWith(FeedConstants.EVENT_PREFIX_REEL)) {
                handleReelInteraction(viewerId, targetId, eventType);
            }
        } catch (Exception ex) {
            log.warn("[AFFINITY-LISTENER] Error processing event {}: {}", eventType, ex.getMessage());
        }
    }

    private void handlePostInteraction(UUID viewerId, UUID postId, String eventType) {
        if (postId == null) return;
        Optional<Post> postOpt = postRepository.findById(postId);
        if (postOpt.isEmpty()) return;

        Post post = postOpt.get();
        UUID authorId = post.getUser() != null ? post.getUser().getId() : null;
        Set<String> tags = extractHashtags(post.getCaption());

        userAffinityService.recordInteraction(viewerId, authorId, postId, tags, eventType);
    }

    private void handleReelInteraction(UUID viewerId, UUID reelId, String eventType) {
        if (reelId == null) return;
        Optional<Reel> reelOpt = reelRepository.findById(reelId);
        if (reelOpt.isEmpty()) return;

        Reel reel = reelOpt.get();
        UUID authorId = reel.getUser() != null ? reel.getUser().getId() : null;
        Set<String> tags = extractHashtags(reel.getCaption());

        userAffinityService.recordInteraction(viewerId, authorId, reelId, tags, eventType);
    }

    public static Set<String> extractHashtags(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptySet();
        }
        Set<String> tags = new HashSet<>();
        Matcher matcher = HASHTAG_PATTERN.matcher(text);
        while (matcher.find()) {
            tags.add(matcher.group(1).toLowerCase());
        }
        return tags;
    }
}

