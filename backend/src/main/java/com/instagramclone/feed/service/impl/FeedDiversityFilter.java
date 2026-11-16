package com.instagramclone.feed.service.impl;

import com.instagramclone.feed.constants.FeedConstants;
import com.instagramclone.feed.dto.response.FeedItemResponse;
import com.instagramclone.feed.enums.FeedItemType;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Ensures visual and creator diversity across timeline feeds:
 * 1. Anti-clustering: Prevents consecutive posts from the same creator.
 * 2. Media interleaving: Smoothly blends carousel/photo posts and vertical video reels.
 * 3. In-Feed Units: Injects Suggested Creators carousel and "All Caught Up" notice.
 */
@Component
public class FeedDiversityFilter {

    /**
     * Applies anti-clustering to a ranked list of items.
     *
     * @param rankedItems Ordered candidate items
     * @param windowSize  Minimum distance between items by the same author
     * @return Diversity-filtered item list
     */
    public List<FeedItemResponse> applyAntiClustering(List<FeedItemResponse> rankedItems, int windowSize) {
        if (rankedItems == null || rankedItems.size() <= 1) {
            return rankedItems != null ? rankedItems : Collections.emptyList();
        }

        List<FeedItemResponse> result = new ArrayList<>(rankedItems.size());
        List<FeedItemResponse> deferred = new LinkedList<>(rankedItems);

        // Keep track of recent authors in sliding window
        Deque<UUID> recentAuthors = new ArrayDeque<>();

        while (!deferred.isEmpty()) {
            boolean added = false;
            Iterator<FeedItemResponse> it = deferred.iterator();

            while (it.hasNext()) {
                FeedItemResponse candidate = it.next();
                UUID authorId = candidate.getAuthor() != null ? candidate.getAuthor().getId() : null;

                // Check if this author was recently placed in sliding window
                if (authorId == null || !recentAuthors.contains(authorId)) {
                    result.add(candidate);
                    it.remove();

                    if (authorId != null) {
                        recentAuthors.addLast(authorId);
                        if (recentAuthors.size() > windowSize) {
                            recentAuthors.removeFirst();
                        }
                    }
                    added = true;
                    break;
                }
            }

            // If all remaining candidates are from recent authors, relax the rule for 1 item
            if (!added && !deferred.isEmpty()) {
                FeedItemResponse forced = deferred.remove(0);
                result.add(forced);
                UUID authorId = forced.getAuthor() != null ? forced.getAuthor().getId() : null;
                if (authorId != null) {
                    recentAuthors.addLast(authorId);
                    if (recentAuthors.size() > windowSize) {
                        recentAuthors.removeFirst();
                    }
                }
            }
        }

        return result;
    }

    /**
     * Interleaves posts and reels according to the specified post-to-reel ratio.
     * E.g. postsPerReel = 3 means up to 3 posts followed by 1 reel.
     * If the top reel has a higher ranking score or fresher timestamp than the top post,
     * the higher-scored/fresher item leads the feed to avoid placing stale items at position 0.
     */
    public List<FeedItemResponse> interleavePostsAndReels(
            List<FeedItemResponse> posts,
            List<FeedItemResponse> reels,
            int postsPerReel
    ) {
        if ((posts == null || posts.isEmpty()) && (reels == null || reels.isEmpty())) {
            return Collections.emptyList();
        }
        if (posts == null || posts.isEmpty()) return reels;
        if (reels == null || reels.isEmpty()) return posts;

        int totalSize = posts.size() + reels.size();
        List<FeedItemResponse> combined = new ArrayList<>(totalSize);

        int postIdx = 0;
        int reelIdx = 0;
        int currentPostRun = 0;

        // Determine lead item based on quality / recency
        boolean reelLeads = false;
        FeedItemResponse topPost = posts.get(0);
        FeedItemResponse topReel = reels.get(0);
        Double postScore = topPost.getRankingScore();
        Double reelScore = topReel.getRankingScore();

        if (postScore != null && reelScore != null) {
            if (reelScore > postScore) {
                reelLeads = true;
            }
        } else if (topPost.getCreatedAt() != null && topReel.getCreatedAt() != null) {
            if (topReel.getCreatedAt().isAfter(topPost.getCreatedAt())) {
                reelLeads = true;
            }
        }

        if (reelLeads) {
            combined.add(reels.get(reelIdx++));
            currentPostRun = 0;
        }

        while (postIdx < posts.size() || reelIdx < reels.size()) {
            if (currentPostRun < postsPerReel && postIdx < posts.size()) {
                combined.add(posts.get(postIdx++));
                currentPostRun++;
            } else if (reelIdx < reels.size()) {
                combined.add(reels.get(reelIdx++));
                currentPostRun = 0;
            } else if (postIdx < posts.size()) {
                // If reels exhausted, finish remaining posts
                combined.add(posts.get(postIdx++));
            }
        }

        return combined;
    }

    /**
     * Injects a Suggested Creators carousel unit into the feed stream at the given interval index.
     */
    public List<FeedItemResponse> injectSuggestedCreators(
            List<FeedItemResponse> items,
            List<PostAuthorResponse> suggestedUsers,
            int interval
    ) {
        if (items == null || items.isEmpty() || suggestedUsers == null || suggestedUsers.isEmpty()) {
            return items != null ? items : Collections.emptyList();
        }

        List<FeedItemResponse> result = new ArrayList<>(items);
        int targetIndex = Math.min(Math.max(FeedConstants.SUGGESTED_CREATORS_MIN_INTERVAL, interval), result.size());

        FeedItemResponse unit = FeedItemResponse.builder()
                .id(UUID.randomUUID())
                .itemType(FeedItemType.SUGGESTED_CREATOR)
                .suggestedAccounts(suggestedUsers)
                .recommendationReason(FeedConstants.REASON_SUGGESTED_FOR_YOU)
                .createdAt(LocalDateTime.now())
                .build();

        result.add(targetIndex, unit);
        return result;
    }

    /**
     * Injects an 'All Caught Up' notice separator if the followed accounts' fresh posts were already viewed.
     */
    public List<FeedItemResponse> injectAllCaughtUpNotice(
            List<FeedItemResponse> items,
            Set<UUID> seenIds
    ) {
        if (items == null || items.isEmpty() || seenIds == null || seenIds.isEmpty()) {
            return items != null ? items : Collections.emptyList();
        }

        // Check if top items are already seen
        long seenCount = items.stream().limit(FeedConstants.ALL_CAUGHT_UP_LOOKAHEAD_ITEMS).filter(i -> Boolean.TRUE.equals(i.getIsSeen())).count();
        if (seenCount >= FeedConstants.ALL_CAUGHT_UP_SEEN_THRESHOLD) {
            List<FeedItemResponse> result = new ArrayList<>(items);
            FeedItemResponse notice = FeedItemResponse.builder()
                    .id(UUID.randomUUID())
                    .itemType(FeedItemType.ALL_CAUGHT_UP_NOTICE)
                    .caption(FeedConstants.MSG_ALL_CAUGHT_UP_NOTICE)
                    .recommendationReason(FeedConstants.REASON_ALL_CAUGHT_UP)
                    .createdAt(LocalDateTime.now())
                    .build();

            // Insert after threshold items
            int insertPos = Math.min(FeedConstants.ALL_CAUGHT_UP_INSERT_POSITION, result.size());
            result.add(insertPos, notice);
            return result;
        }

        return items;
    }
}

