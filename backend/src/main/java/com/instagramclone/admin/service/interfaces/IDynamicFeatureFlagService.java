package com.instagramclone.admin.service.interfaces;

import com.instagramclone.admin.dto.request.UpdateFeatureFlagRequest;
import com.instagramclone.admin.dto.response.FeatureFlagResponse;
import com.instagramclone.admin.entity.DynamicFeatureFlagConfig;

public interface IDynamicFeatureFlagService
        extends IDynamicConfigService<DynamicFeatureFlagConfig, UpdateFeatureFlagRequest, FeatureFlagResponse> {
}
