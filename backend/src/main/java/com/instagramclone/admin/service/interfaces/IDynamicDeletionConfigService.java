package com.instagramclone.admin.service.interfaces;

import com.instagramclone.admin.dto.request.UpdateDeletionConfigRequest;
import com.instagramclone.admin.dto.response.DeletionConfigResponse;
import com.instagramclone.admin.entity.DynamicDeletionConfig;

public interface IDynamicDeletionConfigService
        extends IDynamicConfigService<DynamicDeletionConfig, UpdateDeletionConfigRequest, DeletionConfigResponse> {
}
