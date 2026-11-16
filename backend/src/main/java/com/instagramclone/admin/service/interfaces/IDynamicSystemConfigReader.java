package com.instagramclone.admin.service.interfaces;

/**
 * Narrow read-only abstraction for backend modules consuming runtime system configurations.
 */
public interface IDynamicSystemConfigReader {

    String getString(String key, String fallback);

    int getInt(String key, int fallback, int min, int max);

    long getLong(String key, long fallback, long min, long max);

    String getClientBaseUrl(String fallbackUrl);

    String buildClientUrl(String relativePath);

    String resolveClientEndpointUrl(String configuredUrl, String defaultPath);
}

