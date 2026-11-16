package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.dto.response.AdminActivityItemResponse;
import com.instagramclone.admin.mapper.AdminMapper;
import com.instagramclone.admin.strategy.AdminActivityProvider;
import com.instagramclone.story.entity.Story;
import com.instagramclone.story.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class StoryActivityProvider implements AdminActivityProvider {

    private final StoryRepository storyRepository;
    private final AdminMapper adminMapper;

    @Override
    public List<AdminActivityItemResponse> fetchRecent(Pageable slice) {
        List<AdminActivityItemResponse> items = new ArrayList<>();
        for (Story story : storyRepository.findForAdmin(null, slice).getContent()) {
            items.add(AdminActivityItemResponse.builder()
                    .id("story-" + story.getId())
                    .type("STORY_CREATED")
                    .actionText("posted a story")
                    .actor(adminMapper.toUserSummary(story.getUser()))
                    .targetType("STORY")
                    .targetId(story.getId())
                    .previewUrl(adminMapper.maskUrl(story.getMediaUrl()))
                    .createdAt(story.getCreatedAt())
                    .build());
        }
        return items;
    }
}

