package com.instagramclone.mail.provider;

import com.instagramclone.admin.constants.DynamicSystemConfigKeys;
import com.instagramclone.admin.service.interfaces.IDynamicSystemConfigReader;
import com.instagramclone.mail.config.MailProperties;
import com.instagramclone.mail.util.MailUtils;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SmtpEmailProvider implements IEmailProvider {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailProvider.class);

    private final MailProperties mailProperties;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired(required = false)
    private com.instagramclone.mail.repository.DynamicEmailServerConfigRepository serverConfigRepository;

    @Autowired(required = false)
    private IDynamicSystemConfigReader dynamicSystemConfigReader;

    @Override
    public boolean isAvailable() {
        if (!mailProperties.isEnabled()) {
            return false;
        }
        if (serverConfigRepository != null) {
            java.util.Optional<com.instagramclone.mail.entity.DynamicEmailServerConfig> cfgOpt = serverConfigRepository.findFirstByOrderByCreatedAtAsc();
            if (cfgOpt.isPresent()) {
                com.instagramclone.mail.entity.DynamicEmailServerConfig cfg = cfgOpt.get();
                if (Boolean.TRUE.equals(cfg.getSimulationMode())) {
                    return false;
                }
                if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl impl) {
                    if (cfg.getHost() != null && !cfg.getHost().isBlank()) {
                        impl.setHost(cfg.getHost());
                    }
                    if (cfg.getPort() != null) {
                        impl.setPort(cfg.getPort());
                    }
                    if (cfg.getUsername() != null && !cfg.getUsername().isBlank()) {
                        impl.setUsername(cfg.getUsername());
                    }
                    if (cfg.getPassword() != null && !cfg.getPassword().isBlank()) {
                        impl.setPassword(cfg.getPassword());
                    }
                }
            }
        }
        if (mailSender == null) {
            return false;
        }
        if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl impl) {
            String user = impl.getUsername();
            String pass = impl.getPassword();
            if (user == null || user.isBlank() || pass == null || pass.isBlank()) {
                return false;
            }
        }
        return true;
    }

    @Override
    public void send(String recipientEmail, String subject, String htmlBody, String textBody, String fromEmail, String fromName) {
        if (!isAvailable()) {
            log.info("Email delivery disabled or mail sender unavailable. Simulated delivery for [{}] to [{}] from [{} <{}>]",
                    sanitizeSubject(subject), MailUtils.maskRecipient(recipientEmail), fromName, fromEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String defaultFrom = (dynamicSystemConfigReader != null)
                    ? dynamicSystemConfigReader.getString(DynamicSystemConfigKeys.MAIL_FROM_ADDRESS, mailProperties.getFrom())
                    : mailProperties.getFrom();
            String defaultName = (dynamicSystemConfigReader != null)
                    ? dynamicSystemConfigReader.getString(DynamicSystemConfigKeys.MAIL_FROM_NAME, mailProperties.getFromName())
                    : mailProperties.getFromName();

            String effectiveFrom = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : defaultFrom;
            String effectiveName = (fromName != null && !fromName.isBlank()) ? fromName : defaultName;
            if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl impl) {
                if (impl.getUsername() != null && (impl.getUsername().endsWith("@gmail.com") || impl.getUsername().endsWith("@googlemail.com"))) {
                    effectiveFrom = impl.getUsername();
                }
            }

            helper.setFrom(new InternetAddress(effectiveFrom, effectiveName));
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(textBody, htmlBody);

            mailSender.send(message);
            log.info("Successfully dispatched email via SMTP to [{}] with subject [{}]", MailUtils.maskRecipient(recipientEmail), sanitizeSubject(subject));
        } catch (Exception ex) {
            String sanitizedError = sanitizeErrorMessage(ex.getMessage(), recipientEmail);
            log.error("SMTP delivery failed for [{}] to [{}]: {}", sanitizeSubject(subject), MailUtils.maskRecipient(recipientEmail), sanitizedError);
            throw new RuntimeException("SMTP delivery failed: " + sanitizedError);
        }
    }



    private String sanitizeSubject(String subject) {
        if (subject == null) return "";
        return subject.replaceAll("\\b\\d{6}\\b", "[REDACTED_OTP]");
    }

    private String sanitizeErrorMessage(String error, String recipientEmail) {
        if (error == null || error.isBlank()) return "Unknown SMTP transmission error";
        String sanitized = error;
        if (recipientEmail != null && !recipientEmail.isBlank()) {
            sanitized = sanitized.replace(recipientEmail, MailUtils.maskRecipient(recipientEmail));
        }
        return sanitized.replaceAll("\\b\\d{6}\\b", "[REDACTED_OTP]");
    }
}
