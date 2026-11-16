package com.instagramclone.reel.service.interfaces;
import java.util.UUID;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.reel.dto.request.CreateReelRequest;
import com.instagramclone.reel.dto.response.ReelResponse;
import org.springframework.data.domain.Pageable;

public interface IReelService {

    ReelResponse createReel(CreateReelRequest request);

    default PageResponse<ReelResponse> getReels(Pageable pageable) {
        return getReels(pageable, null);
    }

    PageResponse<ReelResponse> getReels(Pageable pageable, Long seed);

    ReelResponse getReelById(UUID reelId);

    PageResponse<ReelResponse> getUserReels(UUID userId, Pageable pageable);

    PageResponse<ReelResponse> getReelsByAudio(String audioTitle, Pageable pageable);

    long countReelsByAudio(String audioTitle);

    void deleteReel(UUID reelId);

    ReelResponse updateReel(UUID reelId, com.instagramclone.reel.dto.request.UpdateReelRequest request);

    ReelResponse toggleArchiveReel(UUID reelId);

    PageResponse<ReelResponse> getArchivedReels(Pageable pageable);

    ReelResponse restoreReel(UUID reelId);

    PageResponse<ReelResponse> getRecentlyDeletedReels(Pageable pageable);

    void permanentlyDeleteReel(UUID reelId);

    PageResponse<ReelResponse> getSavedReels(Pageable pageable);

    default PageResponse<ReelResponse> getFollowingReels(Pageable pageable) {
        return getFollowingReels(pageable, null);
    }

    PageResponse<ReelResponse> getFollowingReels(Pageable pageable, Long seed);

    PageResponse<ReelResponse> getReelsByHashtag(String hashtag, Pageable pageable);

    ReelResponse togglePinReel(UUID reelId);

    ReelResponse createDraft(CreateReelRequest request);

    PageResponse<ReelResponse> getDrafts(Pageable pageable);

    ReelResponse publishDraft(UUID reelId);

    void markNotInterested(UUID reelId);

    void removeNotInterested(UUID reelId);

    ReelResponse unarchiveReel(UUID reelId);

    void unsaveReel(UUID reelId);

    com.instagramclone.admin.dto.response.ReportResponse reportReel(UUID reelId, com.instagramclone.reel.dto.request.CreateReelReportRequest request);
}
