package com.instagramclone.admin.service.interfaces;

import java.util.UUID;

/**
 * Common LSP-compliant contract for dynamically configurable admin settings backed by persistence and cache.
 */
public interface IDynamicConfigService<E, REQ, RES> {

    RES getConfigResponse();

    E getActiveConfig();

    RES updateConfig(REQ request, UUID adminId);

    RES resetToDefault(UUID adminId);

    void initDefaultConfig();
}

