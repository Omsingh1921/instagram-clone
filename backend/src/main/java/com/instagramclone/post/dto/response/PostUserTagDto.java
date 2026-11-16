package com.instagramclone.post.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostUserTagDto {
    private UUID userId;
    private String username;
    private Double xCoord;
    private Double yCoord;
}
