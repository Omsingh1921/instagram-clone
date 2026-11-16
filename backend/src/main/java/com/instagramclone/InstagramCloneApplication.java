package com.instagramclone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableAsync
@EnableScheduling
public class InstagramCloneApplication {

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(InstagramCloneApplication.class, args);
    }

    private static void loadDotenv() {
        Path[] candidates = new Path[]{
                Paths.get(".env"),
                Paths.get("backend", ".env"),
                Paths.get("..", "backend", ".env"),
                Paths.get(System.getProperty("user.dir", "."), ".env"),
                Paths.get(System.getProperty("user.dir", "."), "backend", ".env")
        };

        for (Path envPath : candidates) {
            if (Files.exists(envPath)) {
                try {
                    List<String> lines = Files.readAllLines(envPath);
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                            continue;
                        }
                        int idx = line.indexOf('=');
                        String key = line.substring(0, idx).trim();
                        String val = line.substring(idx + 1).trim();
                        if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.substring(1, val.length() - 1);
                        }
                        if (!val.isEmpty()) {
                            System.setProperty(key, val);
                        }
                    }
                    System.out.println("[InstagramClone] Successfully loaded environment from " + envPath.toAbsolutePath());
                    break;
                } catch (Exception e) {
                    System.err.println("[InstagramClone] Warning: Could not read .env at " + envPath + ": " + e.getMessage());
                }
            }
        }
    }
}
