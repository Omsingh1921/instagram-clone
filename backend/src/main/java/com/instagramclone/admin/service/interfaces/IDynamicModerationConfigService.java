package com.instagramclone.admin.service.interfaces;

import com.instagramclone.admin.dto.request.UpdateModerationConfigRequest;
import com.instagramclone.admin.dto.response.ModerationConfigResponse;
import com.instagramclone.admin.entity.DynamicModerationConfig;

public interface IDynamicModerationConfigService
                extends
                IDynamicConfigService<DynamicModerationConfig, UpdateModerationConfigRequest, ModerationConfigResponse> {
}
