package com.instagramclone.integration.cloudinary;

import com.cloudinary.Cloudinary;
import com.cloudinary.EagerTransformation;
import com.cloudinary.Uploader;
import com.cloudinary.Util;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CloudinaryServiceTest {

    static class CloudinarySdkVerifier extends Util {
        static Map<String, Object> verifyBuildUploadParams(Map<String, Object> params) {
            return buildUploadParams(params);
        }
    }

    @Test
    @DisplayName("Video upload passes List<EagerTransformation> so Cloudinary SDK buildUploadParams succeeds without ClassCastException")
    @SuppressWarnings("unchecked")
    void uploadVideoPassesListForEagerParam() throws Exception {
        CloudinaryProperties props = new CloudinaryProperties();
        props.setCloudName("demo-cloud");
        props.setApiKey("demo-key");
        props.setApiSecret("demo-secret");
        props.setMaxRetries(0);
        props.setFallbackOnFailure(false);

        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), any(Map.class))).thenReturn(Map.of(
                "public_id", "instagram-clone/reels/u1/abc",
                "secure_url", "https://res.cloudinary.com/demo-cloud/video/upload/reel.mp4"
        ));

        CloudinaryService service = new CloudinaryService(cloudinary, props);
        byte[] payload = new byte[]{0x00, 0x00, 0x00, 0x18, 'f', 't', 'y', 'p'};

        Map<String, Object> result = service.upload(payload, "instagram-clone/reels/u1", "video", "reel.mp4");
        assertThat(result.get("secure_url")).isEqualTo("https://res.cloudinary.com/demo-cloud/video/upload/reel.mp4");

        ArgumentCaptor<Map<String, Object>> paramsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(uploader).upload(eq(payload), paramsCaptor.capture());

        Map<String, Object> capturedParams = paramsCaptor.getValue();
        assertThat(capturedParams.get("eager")).isInstanceOf(List.class);
        List<?> eagerList = (List<?>) capturedParams.get("eager");
        assertThat(eagerList).hasSize(1);
        assertThat(eagerList.get(0)).isInstanceOf(EagerTransformation.class);

        Map<String, Object> sdkBuilt = CloudinarySdkVerifier.verifyBuildUploadParams(capturedParams);
        assertThat(sdkBuilt.get("eager")).isEqualTo("so_0,w_720,c_limit,q_auto/jpg");
    }
}

