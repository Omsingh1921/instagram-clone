package com.instagramclone.mail.config;

import com.instagramclone.mail.enums.EmailCategory;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

    private boolean enabled = true;
    private String from = "no-reply@instagram.com";
    private String fromName = "Instagram";
    private String verificationUrl = "http://localhost:5173/verify-email";
    private String resetUrl = "http://localhost:5173/reset-password";
    private String unsubscribeUrl = "http://localhost:5173/unsubscribe";
    private String unsubscribeSecret;

    public String getUnsubscribeSecret() {
        if (unsubscribeSecret == null || unsubscribeSecret.isBlank()) {
            return "instagram-email-unsubscribe-hmac-sha256-secret-key-32bytes";
        }
        return unsubscribeSecret;
    }
    private long unsubscribeTokenValidityDays = 30;
    private long verificationTokenValidityMinutes = 1440; // 24 hours
    private long resetTokenValidityMinutes = 30; // 30 minutes

    private Senders senders = new Senders();

    public SenderIdentity getSenderForCategory(EmailCategory category) {
        String defaultName = switch (category) {
            case SECURITY -> "Instagram Security";
            case ACCOUNT -> "Instagram";
            case SOCIAL_ACTIVITY -> "Instagram";
            case MESSAGING -> "Instagram Direct";
            case DIGEST_PRODUCT -> "Instagram Updates";
        };

        SenderIdentity fallback = new SenderIdentity(from, defaultName);
        if (senders == null) {
            return fallback;
        }

        SenderIdentity sender = switch (category) {
            case SECURITY -> senders.getSecurity();
            case ACCOUNT -> senders.getAccount();
            case SOCIAL_ACTIVITY -> senders.getActivity();
            case MESSAGING -> senders.getMessaging();
            case DIGEST_PRODUCT -> senders.getDigest();
        };

        if (sender == null) {
            return fallback;
        }
        String resolvedFrom = (sender.getFrom() != null && !sender.getFrom().isBlank()) ? sender.getFrom() : from;
        String resolvedName = (sender.getName() != null && !sender.getName().isBlank()) ? sender.getName() : defaultName;
        return new SenderIdentity(resolvedFrom, resolvedName);
    }

    @Data
    public static class Senders {
        private SenderIdentity security;
        private SenderIdentity account;
        private SenderIdentity activity;
        private SenderIdentity messaging;
        private SenderIdentity digest;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SenderIdentity {
        private String from;
        private String name;
    }
}
