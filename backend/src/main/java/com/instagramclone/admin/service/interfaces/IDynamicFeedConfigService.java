package com.instagramclone.admin.service.interfaces;

import com.instagramclone.admin.dto.request.UpdateFeedConfigRequest;
import com.instagramclone.admin.dto.response.FeedConfigResponse;
import com.instagramclone.admin.entity.DynamicFeedConfig;

public interface IDynamicFeedConfigService
        extends IDynamicConfigService<DynamicFeedConfig, UpdateFeedConfigRequest, FeedConfigResponse> {
}
