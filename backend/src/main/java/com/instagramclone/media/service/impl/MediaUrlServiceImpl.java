package com.instagramclone.media.service.impl;

import com.instagramclone.integration.cloudinary.CloudinaryProperties;
import com.instagramclone.media.constants.MediaConstants;
import com.instagramclone.media.service.interfaces.IMediaUrlService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Production implementation of IMediaUrlService.
 * Seamlessly abstracts and hides Cloudinary storage domain and cloud name from public API endpoints.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MediaUrlServiceImpl implements IMediaUrlService {

    private final CloudinaryProperties cloudinaryProperties;

    @Value("${app.media.cdn-prefix:" + MediaConstants.DEFAULT_CDN_PREFIX + "}")
    private String cdnPrefix;

    @Override
    public String maskUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return rawUrl;
        }

        String cloudName = cloudinaryProperties.getCloudName();
        if (cloudName != null && !cloudName.isBlank()) {
            String cloudinaryBase = MediaConstants.CLOUDINARY_URL_BASE + cloudName;
            if (rawUrl.startsWith(cloudinaryBase)) {
                return rawUrl.replace(cloudinaryBase, cdnPrefix);
            }
        }

        // Generic fallback if rawUrl starts with "https://res.cloudinary.com/"
        if (rawUrl.startsWith(MediaConstants.CLOUDINARY_URL_BASE)) {
            int cloudNameEndIndex = rawUrl.indexOf('/', MediaConstants.CLOUDINARY_URL_BASE.length());
            if (cloudNameEndIndex != -1) {
                return cdnPrefix + rawUrl.substring(cloudNameEndIndex);
            }
        }

        return rawUrl;
    }

    @Override
    public String unmaskUrl(String maskedUrl) {
        if (maskedUrl == null || maskedUrl.isBlank()) {
            return maskedUrl;
        }

        String cloudName = cloudinaryProperties.getCloudName();
        if (cloudName != null && !cloudName.isBlank() && maskedUrl.startsWith(cdnPrefix)) {
            String cloudinaryBase = MediaConstants.CLOUDINARY_URL_BASE + cloudName;
            return maskedUrl.replace(cdnPrefix, cloudinaryBase);
        }

        return maskedUrl;
    }

    @Override
    public String getCdnPrefix() {
        return cdnPrefix;
    }
}

