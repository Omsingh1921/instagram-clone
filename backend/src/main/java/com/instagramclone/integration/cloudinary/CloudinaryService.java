package com.instagramclone.integration.cloudinary;

import com.cloudinary.Cloudinary;
import com.cloudinary.EagerTransformation;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.utility.UUIDUtility;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Cloudinary technical integration service adhering to Sections 4, 6, 7, 8, 18,
 * 25 & 26.
 * Encapsulates upload, deletion, and transformation operations with resilient
 * fallback.
 */
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    @Value("${app.upload.dir:uploads}")
    private String localUploadDir;

    public boolean isCloudinaryActive() {
        return properties.isConfigured();
    }

    /**
     * Uploads media bytes to Cloudinary with folder partitioning and UUID naming.
     * When configured, communicates with Cloudinary and surfaces clear diagnostic
     * errors.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> upload(byte[] bytes, String folder, String resourceType, String originalFilename) {
        if (bytes == null || bytes.length == 0) {
            throw new BadRequestException("Media upload payload is empty");
        }

        String publicId = folder + "/" + UUIDUtility.randomUUID();

        if (properties.isConfigured()) {
            int maxAttempts = Math.max(1, properties.getMaxRetries() + 1);
            Exception lastException = null;

            for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    Map<String, Object> params = new HashMap<>();
                    params.put("public_id", publicId);
                    params.put("resource_type", resourceType != null ? resourceType : "auto");
                    params.put("overwrite", false);
                    params.put("unique_filename", false);
                    params.put("use_filename", false);

                    if ("video".equalsIgnoreCase(resourceType)) {
                        // Cloudinary SDK requires eager to be a List<Transformation>, not a raw String
                        params.put("eager", Collections.singletonList(
                                new EagerTransformation()
                                        .rawTransformation("so_0,w_720,c_limit,q_auto")
                                        .format("jpg")));
                        params.put("eager_async", true);
                    }

                    log.info("Uploading media asset to Cloudinary (attempt {}/{}): publicId={}, resourceType={}",
                            attempt, maxAttempts, publicId, resourceType);
                    Map<?, ?> result = cloudinary.uploader().upload(bytes, params);
                    log.info("Cloudinary upload successful for publicId={}: url={}", publicId,
                            result.get("secure_url"));
                    return (Map<String, Object>) result;

                } catch (Exception ex) {
                    lastException = ex;
                    log.warn("Cloudinary upload attempt {}/{} failed for publicId={}: {}",
                            attempt, maxAttempts, publicId, ex.getMessage());
                    if (attempt < maxAttempts) {
                        try {
                            Thread.sleep(properties.getRetryBackoffMs() * attempt);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
            }

            log.error("All Cloudinary upload attempts failed for publicId={} with cloud_name='{}'",
                    publicId, properties.getCloudName());
            if (properties.isFallbackOnFailure()) {
                log.warn("Falling back to local disk storage for publicId={}", publicId);
                return storeLocally(bytes, publicId, resourceType, originalFilename);
            }
            throw new BadRequestException("Cloudinary upload failed: "
                    + (lastException != null ? lastException.getMessage() : "Unknown error")
                    + ". Please check your CLOUDINARY_CLOUD_NAME, API Key, and API Secret.");
        }

        // Resilient fallback storage for unconfigured local/test environments
        log.info("Cloudinary not configured; storing file locally for publicId={}", publicId);
        return storeLocally(bytes, publicId, resourceType, originalFilename);
    }

    /**
     * Deletes a Cloudinary asset by publicId and resourceType adhering to Section
     * 23.
     */
    public boolean delete(String publicId, String resourceType) {
        if (publicId == null || publicId.isBlank())
            return false;

        if (properties.isConfigured()) {
            try {
                Map<String, Object> params = ObjectUtils.asMap(
                        "resource_type", resourceType != null ? resourceType : "image",
                        "invalidate", true);
                Map<?, ?> result = cloudinary.uploader().destroy(publicId, params);
                String resultStatus = (String) result.get("result");
                log.info("Cloudinary destroy publicId={} result={}", publicId, resultStatus);
                return "ok".equalsIgnoreCase(resultStatus);
            } catch (Exception ex) {
                log.warn("Cloudinary asset deletion failed for publicId={}: {}", publicId, ex.getMessage());
                return false;
            }
        }

        // Clean up local fallback file if exists
        try {
            Path targetDir = Paths.get(localUploadDir).toAbsolutePath().normalize();
            String localFilename = publicId.replace('/', '_') + (resourceType.equals("video") ? ".mp4" : ".jpg");
            Path targetPath = targetDir.resolve(localFilename);
            return Files.deleteIfExists(targetPath);
        } catch (Exception ex) {
            log.warn("Local fallback deletion error for {}: {}", publicId, ex.getMessage());
            return false;
        }
    }

    /**
     * Generates an optimized Cloudinary transformation delivery URL adhering to
     * Section 18.
     */
    public String getTransformedUrl(String publicId, String transformation) {
        if (!properties.isConfigured() || publicId == null) {
            return null;
        }
        try {
            return cloudinary.url().transformation(new Transformation().rawTransformation(transformation))
                    .generate(publicId);
        } catch (Exception ex) {
            log.warn("Failed to generate transformed URL for publicId={}: {}", publicId, ex.getMessage());
            return null;
        }
    }

    public String getAvatarUrl(String publicId) {
        return getTransformedUrl(publicId, "w_150,h_150,c_fill,g_face,q_auto,f_auto");
    }

    public String getVideoThumbnailUrl(String publicId) {
        if (!properties.isConfigured() || publicId == null) {
            return null;
        }
        try {
            return cloudinary.url()
                    .resourceType("video")
                    .format("jpg")
                    .transformation(new Transformation<>().rawTransformation("so_0,w_720,c_limit,q_auto"))
                    .generate(publicId);
        } catch (Exception ex) {
            log.warn("Failed to generate video thumbnail URL for publicId={}: {}", publicId, ex.getMessage());
            return getTransformedUrl(publicId, "so_0,w_720,c_limit,q_auto,f_jpg");
        }
    }

    public String getProgressiveImageUrl(String publicId, int width) {
        if (!properties.isConfigured() || publicId == null) {
            return null;
        }
        try {
            return cloudinary.url()
                    .resourceType("image")
                    .transformation(new Transformation<>()
                            .rawTransformation(String.format("fl_progressive,q_auto,f_auto,w_%d,c_limit", width)))
                    .generate(publicId);
        } catch (Exception ex) {
            log.warn("Failed to generate progressive image URL for publicId={}: {}", publicId, ex.getMessage());
            return getTransformedUrl(publicId, String.format("w_%d,c_limit,q_auto,f_auto", width));
        }
    }

    public String getBlurPlaceholderUrl(String publicId) {
        if (!properties.isConfigured() || publicId == null) {
            return null;
        }
        try {
            return cloudinary.url()
                    .resourceType("image")
                    .transformation(new Transformation<>().rawTransformation("w_30,q_20,e_blur:1000,f_auto"))
                    .generate(publicId);
        } catch (Exception ex) {
            log.warn("Failed to generate blur placeholder URL for publicId={}: {}", publicId, ex.getMessage());
            return null;
        }
    }

    public String getResponsiveImageUrl(String publicId, int width) {
        return getProgressiveImageUrl(publicId, width);
    }

        private Map<String, Object> storeLocally(byte[] bytes, String publicId, String resourceType,
            String originalFilename) {
        try {
            Path targetDir = Paths.get(localUploadDir).toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            String ext = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                    : (resourceType != null && resourceType.equals("video") ? ".mp4" : ".jpg");

            String localFilename = publicId.replace('/', '_') + ext;
            Path targetPath = targetDir.resolve(localFilename);
            Files.write(targetPath, bytes);

            String localUrl = "/uploads/" + localFilename;

            Map<String, Object> result = new HashMap<>();
            result.put("public_id", publicId);
            result.put("secure_url", localUrl);
            result.put("url", localUrl);
            result.put("resource_type", resourceType != null ? resourceType : "image");
            result.put("format", ext.replace(".", ""));
            result.put("width", (resourceType != null && resourceType.equals("video")) ? 1920 : 1080);
            result.put("height", (resourceType != null && resourceType.equals("video")) ? 1080 : 1080);
            result.put("bytes", (long) bytes.length);
            if (resourceType != null && resourceType.equals("video")) {
                result.put("duration", 15.0);
            }
            return result;
        } catch (IOException ex) {
            log.error("Failed to store media in local fallback storage: {}", ex.getMessage());
            throw new BadRequestException("Failed to store uploaded media");
        }
    }

    public Map<String, Object> generatePresignedUploadSignature(String folder) {
        long timestamp = System.currentTimeMillis() / 1000L;
        Map<String, Object> paramsToSign = new HashMap<>();
        paramsToSign.put("folder", folder);
        paramsToSign.put("timestamp", timestamp);

        String signature = cloudinary.apiSignRequest(paramsToSign, properties.getApiSecret());

        Map<String, Object> result = new HashMap<>();
        result.put("signature", signature);
        result.put("timestamp", timestamp);
        result.put("folder", folder);
        result.put("apiKey", properties.getApiKey());
        result.put("cloudName", properties.getCloudName());
        result.put("uploadUrl", "https://api.cloudinary.com/v1_1/" + properties.getCloudName() + "/auto/upload");
        return result;
    }
}
