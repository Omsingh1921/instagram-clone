package com.instagramclone.media.service.interfaces;

/**
 * Service interface for masking and unmasking media storage URLs adhering to CDN privacy standards.
 */
public interface IMediaUrlService {

    /**
     * Masks raw Cloudinary or storage provider URL into a branded CDN/proxy URL.
     *
     * @param rawUrl Original storage provider URL
     * @return Masked CDN/relative URL
     */
    String maskUrl(String rawUrl);

    /**
     * Unmasks a branded CDN/proxy URL back to the real storage provider URL.
     *
     * @param maskedUrl Masked CDN/relative URL
     * @return Original storage provider URL
     */
    String unmaskUrl(String maskedUrl);

    /**
     * Returns the currently configured CDN prefix (e.g. "/cdn").
     *
     * @return CDN prefix string
     */
    String getCdnPrefix();
}

