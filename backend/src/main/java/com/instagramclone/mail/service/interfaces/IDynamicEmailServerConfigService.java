package com.instagramclone.mail.service.interfaces;

import com.instagramclone.mail.dto.request.UpdateEmailServerConfigRequest;
import com.instagramclone.mail.dto.response.EmailServerConfigResponse;
import com.instagramclone.mail.entity.DynamicEmailServerConfig;

import java.util.UUID;

public interface IDynamicEmailServerConfigService {

    EmailServerConfigResponse getConfigResponse();

    DynamicEmailServerConfig getActiveConfig();

    EmailServerConfigResponse updateConfig(UpdateEmailServerConfigRequest request, UUID adminId);

    EmailServerConfigResponse resetToDefault(UUID adminId);

    void initDefaultConfig();

    void sendTestEmail(String recipientEmail, UUID adminId);
}
