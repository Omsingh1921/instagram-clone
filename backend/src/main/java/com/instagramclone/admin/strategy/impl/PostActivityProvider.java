package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.dto.response.AdminActivityItemResponse;
import com.instagramclone.admin.mapper.AdminMapper;
import com.instagramclone.admin.strategy.AdminActivityProvider;
import com.instagramclone.post.entity.Post;
import com.instagramclone.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PostActivityProvider implements AdminActivityProvider {

    private final PostRepository postRepository;
    private final AdminMapper adminMapper;

    @Override
    public List<AdminActivityItemResponse> fetchRecent(Pageable slice) {
        List<AdminActivityItemResponse> items = new ArrayList<>();
        for (Post post : postRepository.findForAdmin(null, slice).getContent()) {
            String thumb = (post.getMediaList() != null && !post.getMediaList().isEmpty())
                    ? adminMapper.maskUrl(post.getMediaList().get(0).getMediaUrl())
                    : null;
            items.add(AdminActivityItemResponse.builder()
                    .id("post-" + post.getId())
                    .type("POST_CREATED")
                    .actionText("created a new post")
                    .actor(adminMapper.toUserSummary(post.getUser()))
                    .targetType("POST")
                    .targetId(post.getId())
                    .previewUrl(thumb)
                    .createdAt(post.getCreatedAt())
                    .build());
        }
        return items;
    }
}

