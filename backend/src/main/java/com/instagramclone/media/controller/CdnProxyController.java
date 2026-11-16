package com.instagramclone.media.controller;

import com.instagramclone.integration.cloudinary.CloudinaryProperties;
import com.instagramclone.media.constants.MediaConstants;
import com.instagramclone.ratelimit.RateLimit;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.time.Duration;

/**
 * Transparent reverse proxy controller mapping /cdn/** to the configured media storage provider.
 * Ensures complete parity in production environments so client browsers stream media solely
 * through /cdn/... without exposing underlying storage domains or credentials.
 */
@RestController
@RequestMapping(MediaConstants.DEFAULT_CDN_PREFIX)
@RequiredArgsConstructor
@Slf4j
public class CdnProxyController {

    private final CloudinaryProperties cloudinaryProperties;

    @RateLimit(category = MediaConstants.RATE_LIMIT_CDN_PROXY, limit = 120, windowSeconds = 60)
    @GetMapping(MediaConstants.WILDCARD_PATH)
    public ResponseEntity<Resource> proxyMedia(HttpServletRequest request) {
        if (!cloudinaryProperties.isConfigured()) {
            log.warn("CDN reverse proxy unavailable: media storage provider is not configured");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }

        String path = request.getRequestURI();
        String subPath = path.startsWith(MediaConstants.DEFAULT_CDN_PREFIX)
                ? path.substring(MediaConstants.DEFAULT_CDN_PREFIX.length())
                : path;

        if (!isValidCdnSubPath(subPath)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        String targetUrl = MediaConstants.CLOUDINARY_URL_BASE + cloudinaryProperties.getCloudName().trim() + subPath;
        String query = request.getQueryString();
        if (query != null && !query.isBlank()) {
            targetUrl += "?" + query;
        }

        HttpURLConnection connection = null;
        try {
            URL url = URI.create(targetUrl).toURL();
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod(MediaConstants.HTTP_METHOD_GET);
            connection.setConnectTimeout(MediaConstants.CDN_PROXY_CONNECT_TIMEOUT_MS);
            connection.setReadTimeout(MediaConstants.CDN_PROXY_READ_TIMEOUT_MS);

            // Forward Range header if present (crucial for video streaming & scrubbing)
            String range = request.getHeader(HttpHeaders.RANGE);
            if (range != null && !range.isBlank()) {
                connection.setRequestProperty(HttpHeaders.RANGE, range);
            }

            int responseCode = connection.getResponseCode();
            if (responseCode >= HttpStatus.BAD_REQUEST.value()) {
                connection.disconnect();
                return ResponseEntity.status(responseCode).build();
            }

            HttpHeaders responseHeaders = new HttpHeaders();
            String contentType = connection.getContentType();
            if (contentType != null) {
                try {
                    responseHeaders.setContentType(MediaType.parseMediaType(contentType));
                } catch (Exception ignored) {
                    responseHeaders.set(HttpHeaders.CONTENT_TYPE, contentType);
                }
            }

            long contentLength = connection.getContentLengthLong();
            if (contentLength > 0) {
                responseHeaders.setContentLength(contentLength);
            }

            String contentRange = connection.getHeaderField(HttpHeaders.CONTENT_RANGE);
            if (contentRange != null) {
                responseHeaders.set(HttpHeaders.CONTENT_RANGE, contentRange);
            }

            String acceptRanges = connection.getHeaderField(HttpHeaders.ACCEPT_RANGES);
            responseHeaders.set(
                    HttpHeaders.ACCEPT_RANGES,
                    acceptRanges != null ? acceptRanges : MediaConstants.HEADER_VALUE_BYTES
            );

            responseHeaders.setCacheControl(
                    CacheControl.maxAge(Duration.ofDays(MediaConstants.CDN_CACHE_DURATION_DAYS)).cachePublic()
            );

            final HttpURLConnection activeConn = connection;
            InputStream inputStream = new FilterInputStream(connection.getInputStream()) {
                @Override
                public void close() throws IOException {
                    try {
                        super.close();
                    } finally {
                        activeConn.disconnect();
                    }
                }
            };
            InputStreamResource resource = new InputStreamResource(inputStream);

            HttpStatus status = responseCode == HttpURLConnection.HTTP_PARTIAL
                    ? HttpStatus.PARTIAL_CONTENT
                    : HttpStatus.OK;

            return ResponseEntity.status(status)
                    .headers(responseHeaders)
                    .body(resource);
        } catch (Exception ex) {
            if (connection != null) {
                connection.disconnect();
            }
            log.warn("CDN reverse proxy error for path {}: {}", subPath, ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }

    private boolean isValidCdnSubPath(String subPath) {
        if (subPath == null || subPath.isBlank() || subPath.contains("..") || subPath.contains("@")) {
            return false;
        }
        return subPath.startsWith(MediaConstants.PATH_IMAGE_UPLOAD + "/")
                || subPath.startsWith(MediaConstants.PATH_VIDEO_UPLOAD + "/")
                || subPath.startsWith(MediaConstants.PATH_RAW_UPLOAD + "/");
    }
}
