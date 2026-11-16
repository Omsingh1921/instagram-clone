package com.instagramclone.engagement.dto.request;

import com.instagramclone.engagement.constants.EngagementConstants;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareRequest {

    @Builder.Default
    private String shareType = EngagementConstants.DEFAULT_SHARE_TYPE; // COPY_LINK, DIRECT_MESSAGE, EXTERNAL

    private UUID recipientId;
}
