package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.dto.response.AdminActivityItemResponse;
import com.instagramclone.admin.mapper.AdminMapper;
import com.instagramclone.admin.strategy.AdminActivityProvider;
import com.instagramclone.follow.entity.Follow;
import com.instagramclone.follow.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class FollowActivityProvider implements AdminActivityProvider {

    private final FollowRepository followRepository;
    private final AdminMapper adminMapper;

    @Override
    public List<AdminActivityItemResponse> fetchRecent(Pageable slice) {
        List<AdminActivityItemResponse> items = new ArrayList<>();
        for (Follow follow : followRepository.findRecentFollows(slice)) {
            items.add(AdminActivityItemResponse.builder()
                    .id("follow-" + follow.getId())
                    .type("USER_FOLLOWED")
                    .actionText("followed @" + follow.getFollowing().getUsername())
                    .actor(adminMapper.toUserSummary(follow.getFollower()))
                    .targetType("USER")
                    .targetId(follow.getFollowing().getId())
                    .createdAt(follow.getCreatedAt())
                    .build());
        }
        return items;
    }
}

