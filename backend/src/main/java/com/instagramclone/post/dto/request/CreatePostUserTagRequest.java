package com.instagramclone.post.dto.request;

import com.instagramclone.post.constants.PostConstants;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostUserTagRequest {
    private UUID userId;
    @Builder.Default
    private Double xCoord = PostConstants.DEFAULT_TAG_COORD;
    @Builder.Default
    private Double yCoord = PostConstants.DEFAULT_TAG_COORD;
}
