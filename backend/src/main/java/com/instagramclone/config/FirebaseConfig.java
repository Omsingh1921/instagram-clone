package com.instagramclone.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.util.StringUtils;

import java.io.InputStream;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.service-account.path:}")
    private String serviceAccountPath;

    private final ResourceLoader resourceLoader;

    public FirebaseConfig(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Bean
    public FirebaseApp firebaseApp() {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        if (StringUtils.hasText(serviceAccountPath)) {
            try {
                Resource resource = resourceLoader.getResource(serviceAccountPath);
                if (!resource.exists() && !serviceAccountPath.startsWith("file:") && !serviceAccountPath.startsWith("classpath:")) {
                    resource = resourceLoader.getResource("file:" + serviceAccountPath);
                    if (!resource.exists()) {
                        resource = resourceLoader.getResource("classpath:" + serviceAccountPath);
                    }
                }
                if (resource.exists()) {
                    try (InputStream serviceAccount = resource.getInputStream()) {
                        FirebaseOptions options = FirebaseOptions.builder()
                                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                                .build();
                        FirebaseApp app = FirebaseApp.initializeApp(options);
                        log.info("FirebaseApp initialized successfully with credentials from: {}", serviceAccountPath);
                        return app;
                    }
                } else {
                    log.warn("Firebase service account resource does not exist at '{}'. Running in simulation mode.", serviceAccountPath);
                }
            } catch (Exception ex) {
                log.warn("Could not initialize FirebaseApp from path '{}': {}. Push notifications will operate in simulation/dev mode.",
                        serviceAccountPath, ex.getMessage());
            }
        } else {
            log.info("No 'firebase.service-account.path' configured. Push notifications will operate in simulation/dev mode.");
        }

        return null;
    }
}

