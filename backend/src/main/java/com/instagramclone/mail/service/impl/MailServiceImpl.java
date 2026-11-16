package com.instagramclone.mail.service.impl;

import com.instagramclone.admin.constants.DynamicSystemConfigKeys;
import com.instagramclone.admin.service.interfaces.IDynamicSystemConfigReader;
import com.instagramclone.mail.service.interfaces.IMailService;
import com.instagramclone.mail.util.MailUtils;

import com.instagramclone.mail.config.MailProperties;
import com.instagramclone.mail.dto.EmailCommand;
import com.instagramclone.mail.enums.EmailPriority;
import com.instagramclone.mail.enums.EmailType;
import com.instagramclone.mail.entity.EmailDeliveryLog;
import com.instagramclone.security.otp.OtpProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MailServiceImpl implements IMailService {

    private static final Logger log = LoggerFactory.getLogger(MailServiceImpl.class);

    private final MailProperties mailProperties;
    private final OtpProperties otpProperties;
    private final EmailDispatcher emailDispatcher;

    @Autowired(required = false)
    private IDynamicSystemConfigReader dynamicSystemConfigReader;

    @Override
    @Async
    public void sendVerificationEmail(String recipientEmail, String username, String rawToken) {
        log.info("Preparing verification email dispatch for user [{}] to [{}]", username, MailUtils.maskRecipient(recipientEmail));
        String encodedToken = URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        String verifyUrl = resolveClientUrl(mailProperties.getVerificationUrl(), "/verify-email") + "?token=" + encodedToken;

        Map<String, Object> vars = Map.of(
                "username", username != null ? username : "user",
                "verifyUrl", verifyUrl,
                "validityHours", Math.max(1, mailProperties.getVerificationTokenValidityMinutes() / 60)
        );

        emailDispatcher.dispatch(EmailCommand.builder()
                .emailType(EmailType.EMAIL_VERIFICATION)
                .recipientEmail(recipientEmail)
                .priority(EmailPriority.CRITICAL)
                .variables(vars)
                .build());
    }

    @Override
    @Async
    public void sendPasswordResetEmail(String recipientEmail, String username, String rawToken) {
        log.info("Preparing password reset email dispatch for user [{}] to [{}]", username, MailUtils.maskRecipient(recipientEmail));
        String encodedToken = URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        String resetUrl = resolveClientUrl(mailProperties.getResetUrl(), "/reset-password") + "?token=" + encodedToken;

        Map<String, Object> vars = Map.of(
                "username", username != null ? username : "user",
                "resetUrl", resetUrl,
                "validityMinutes", resolveResetValidityMinutes()
        );

        emailDispatcher.dispatch(EmailCommand.builder()
                .emailType(EmailType.PASSWORD_RESET)
                .recipientEmail(recipientEmail)
                .priority(EmailPriority.CRITICAL)
                .variables(vars)
                .build());
    }

    @Override
    @Async
    public void sendPasswordChangedAlert(String recipientEmail, String username) {
        log.info("Preparing password changed security alert dispatch for user [{}] to [{}]", username, MailUtils.maskRecipient(recipientEmail));
        Map<String, Object> vars = Map.of(
                "username", username != null ? username : "user"
        );

        emailDispatcher.dispatch(EmailCommand.builder()
                .emailType(EmailType.PASSWORD_CHANGED)
                .recipientEmail(recipientEmail)
                .priority(EmailPriority.HIGH)
                .variables(vars)
                .build());
    }

    @Override
    public EmailDeliveryLog sendOtpEmail(String recipientEmail, String username, String otpCode) {
        log.info("Preparing OTP email dispatch for user [{}] to email [{}]", username, MailUtils.maskRecipient(recipientEmail));

        int fallbackMinutes = (otpProperties != null) ? otpProperties.getValidityMinutes() : 5;
        int validityMinutes = (dynamicSystemConfigReader != null)
                ? dynamicSystemConfigReader.getInt(DynamicSystemConfigKeys.AUTH_SIGNUP_OTP_EXPIRY_MINUTES, fallbackMinutes, 1, 1440)
                : fallbackMinutes;

        Map<String, Object> vars = Map.of(
                "username", username != null ? username : "user",
                "otpCode", otpCode != null ? otpCode : "",
                "validityMinutes", validityMinutes
        );

        return emailDispatcher.dispatch(EmailCommand.builder()
                .emailType(EmailType.EMAIL_OTP)
                .recipientEmail(recipientEmail)
                .priority(EmailPriority.CRITICAL)
                .variables(vars)
                .build());
    }

    private String resolveClientUrl(String configuredUrl, String defaultPath) {
        if (dynamicSystemConfigReader != null) {
            return dynamicSystemConfigReader.resolveClientEndpointUrl(configuredUrl, defaultPath);
        }
        return configuredUrl;
    }

    private long resolveResetValidityMinutes() {
        long fallback = mailProperties.getResetTokenValidityMinutes();
        return (dynamicSystemConfigReader != null)
                ? dynamicSystemConfigReader.getLong(DynamicSystemConfigKeys.AUTH_PASSWORD_RESET_EXPIRY_MINUTES, fallback, 1L, 1440L)
                : fallback;
    }
}
