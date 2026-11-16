package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.dto.response.AdminActivityItemResponse;
import com.instagramclone.admin.mapper.AdminMapper;
import com.instagramclone.admin.strategy.AdminActivityProvider;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.repository.ReelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ReelActivityProvider implements AdminActivityProvider {

    private final ReelRepository reelRepository;
    private final AdminMapper adminMapper;

    @Override
    public List<AdminActivityItemResponse> fetchRecent(Pageable slice) {
        List<AdminActivityItemResponse> items = new ArrayList<>();
        for (Reel reel : reelRepository.findForAdmin(null, slice).getContent()) {
            String thumb = reel.getThumbnailUrl() != null
                    ? adminMapper.maskUrl(reel.getThumbnailUrl())
                    : adminMapper.maskUrl(reel.getVideoUrl());
            items.add(AdminActivityItemResponse.builder()
                    .id("reel-" + reel.getId())
                    .type("REEL_UPLOADED")
                    .actionText("uploaded a new reel")
                    .actor(adminMapper.toUserSummary(reel.getUser()))
                    .targetType("REEL")
                    .targetId(reel.getId())
                    .previewUrl(thumb)
                    .createdAt(reel.getCreatedAt())
                    .build());
        }
        return items;
    }
}

