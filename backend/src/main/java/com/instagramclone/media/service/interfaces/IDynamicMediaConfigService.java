package com.instagramclone.media.service.interfaces;

import com.instagramclone.media.dto.request.UpdateMediaConfigRequest;
import com.instagramclone.media.dto.response.MediaConfigResponse;
import com.instagramclone.media.entity.DynamicMediaConfig;

import java.util.UUID;

public interface IDynamicMediaConfigService {

    MediaConfigResponse getConfigResponse();

    DynamicMediaConfig getActiveConfig();

    MediaConfigResponse updateConfig(UpdateMediaConfigRequest request, UUID adminId);

    MediaConfigResponse resetToDefault(UUID adminId);

    void initDefaultConfig();
}
