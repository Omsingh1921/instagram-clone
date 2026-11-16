package com.instagramclone.media;

import com.instagramclone.integration.cloudinary.CloudinaryProperties;
import com.instagramclone.media.service.impl.MediaUrlServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MediaUrlServiceTest {

    @Mock
    private CloudinaryProperties cloudinaryProperties;

    private MediaUrlServiceImpl mediaUrlService;

    @BeforeEach
    void setUp() {
        mediaUrlService = new MediaUrlServiceImpl(cloudinaryProperties);
        ReflectionTestUtils.setField(mediaUrlService, "cdnPrefix", "/cdn");
    }

    @Test
    @DisplayName("maskUrl: Should replace Cloudinary domain and cloud name with /cdn")
    void maskUrl_ShouldReplaceCloudinaryDomainWithCdnPrefix() {
        when(cloudinaryProperties.getCloudName()).thenReturn("test-cloud");

        String rawImage = "https://res.cloudinary.com/test-cloud/image/upload/v12345/posts/user1/pic.jpg";
        String maskedImage = mediaUrlService.maskUrl(rawImage);

        assertThat(maskedImage).isEqualTo("/cdn/image/upload/v12345/posts/user1/pic.jpg");

        String rawVideo = "https://res.cloudinary.com/test-cloud/video/upload/so_0,w_720/reels/user1/reel.mp4";
        String maskedVideo = mediaUrlService.maskUrl(rawVideo);

        assertThat(maskedVideo).isEqualTo("/cdn/video/upload/so_0,w_720/reels/user1/reel.mp4");
    }

    @Test
    @DisplayName("maskUrl: Should leave external and already-masked URLs untouched")
    void maskUrl_ShouldLeaveExternalUrlsUntouched() {
        when(cloudinaryProperties.getCloudName()).thenReturn("test-cloud");

        String unsplash = "https://images.unsplash.com/photo-12345";
        assertThat(mediaUrlService.maskUrl(unsplash)).isEqualTo(unsplash);

        String alreadyMasked = "/cdn/image/upload/sample.jpg";
        assertThat(mediaUrlService.maskUrl(alreadyMasked)).isEqualTo(alreadyMasked);

        assertThat(mediaUrlService.maskUrl(null)).isNull();
        assertThat(mediaUrlService.maskUrl("")).isEmpty();
    }

    @Test
    @DisplayName("unmaskUrl: Should restore full Cloudinary URL from /cdn prefix")
    void unmaskUrl_ShouldRestoreCloudinaryDomain() {
        when(cloudinaryProperties.getCloudName()).thenReturn("test-cloud");

        String masked = "/cdn/image/upload/v12345/posts/user1/pic.jpg";
        String unmasked = mediaUrlService.unmaskUrl(masked);

        assertThat(unmasked).isEqualTo("https://res.cloudinary.com/test-cloud/image/upload/v12345/posts/user1/pic.jpg");
    }
}

