package com.instagramclone.admin.service.interfaces;

import com.instagramclone.admin.dto.request.UpdateDynamicSystemConfigRequest;
import com.instagramclone.admin.dto.response.DynamicSystemConfigResponse;

import java.util.List;
import java.util.UUID;

/**
 * Administrative contract for managing key-value dynamic system configurations at runtime.
 */
public interface IDynamicSystemConfigService extends IDynamicSystemConfigReader {

    void initDefaultConfigs();

    List<DynamicSystemConfigResponse> getAllConfigs();

    List<DynamicSystemConfigResponse> getPublicConfigs();

    DynamicSystemConfigResponse updateConfig(String key, UpdateDynamicSystemConfigRequest request, UUID adminId);

    DynamicSystemConfigResponse resetConfig(String key, UUID adminId);

    List<DynamicSystemConfigResponse> resetAllConfigs(UUID adminId);
}

