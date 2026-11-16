package com.instagramclone.media;

import com.instagramclone.integration.cloudinary.CloudinaryProperties;
import com.instagramclone.media.controller.CdnProxyController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CdnProxyControllerTest {

    @Mock
    private CloudinaryProperties cloudinaryProperties;

    private CdnProxyController controller;

    @BeforeEach
    void setUp() {
        controller = new CdnProxyController(cloudinaryProperties);
    }

    @Test
    @DisplayName("proxyMedia: Should return 503 Service Unavailable when storage is not configured")
    void proxyMedia_WhenUnconfigured_ShouldReturn503() {
        when(cloudinaryProperties.isConfigured()).thenReturn(false);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/cdn/image/upload/v1/sample.jpg");
        ResponseEntity<Resource> response = controller.proxyMedia(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    @DisplayName("proxyMedia: Should reject disallowed prefixes, path traversal, and @ injection with 400 Bad Request")
    void proxyMedia_WhenInvalidPath_ShouldReturn400() {
        when(cloudinaryProperties.isConfigured()).thenReturn(true);

        String[] invalidPaths = new String[]{
                "/cdn/unknown/upload/file.jpg",
                "/cdn/image/upload/../secret.jpg",
                "/cdn/@evil.com/image/upload/file.jpg",
                "/cdn/"
        };

        for (String invalidPath : invalidPaths) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", invalidPath);
            ResponseEntity<Resource> response = controller.proxyMedia(request);
            assertThat(response.getStatusCode())
                    .as("Expected 400 for path %s", invalidPath)
                    .isEqualTo(HttpStatus.BAD_REQUEST);
        }
    }
}

