package com.instagramclone.security.service.impl;

import com.instagramclone.admin.constants.DynamicSystemConfigKeys;
import com.instagramclone.admin.service.interfaces.IDynamicSystemConfigReader;
import com.instagramclone.security.config.AccountLockoutProperties;
import com.instagramclone.security.filter.ClientIpResolver;
import com.instagramclone.security.service.interfaces.IAccountLockoutService;
import com.instagramclone.security.service.interfaces.IDeviceDetectionService;

import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.mail.enums.EmailType;
import com.instagramclone.mail.event.EmailEvent;
import com.instagramclone.mail.event.EmailEventPublisher;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountLockoutServiceImpl implements IAccountLockoutService {

    private final UserRepository userRepository;
    private final AccountLockoutProperties properties;
    private final IAuditLogService auditLogService;
    private final EmailEventPublisher emailEventPublisher;
    private final ClientIpResolver clientIpResolver;
    private final IDeviceDetectionService deviceDetectionService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private IDynamicSystemConfigReader dynamicSystemConfigReader;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleFailedLogin(String usernameOrEmail) {
        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            return;
        }

        String normalized = usernameOrEmail.trim().toLowerCase(java.util.Locale.ROOT);
        Optional<User> userOpt;
        if (!normalized.contains("@")) {
            userOpt = userRepository.findByUsernameForUpdate(normalized);
        } else {
            java.util.List<User> accounts = userRepository.findAllByEmail(normalized);
            if (accounts.size() == 1) {
                userOpt = userRepository.findByUsernameForUpdate(accounts.get(0).getUsername());
            } else {
                // Multi-account email or nonexistent: do not lock all accounts sharing email
                return;
            }
        }
        if (userOpt.isEmpty()) {
            // Anti-enumeration: Silent return if user does not exist
            return;
        }

        User user = userOpt.get();
        LocalDateTime now = LocalDateTime.now();

        // If the account is currently locked, keep lock in place until expiry
        if (user.getLockoutUntil() != null && user.getLockoutUntil().isAfter(now)) {
            log.warn("Login attempt on already locked account: {}", user.getUsername());
            return;
        }

        // If a previous lockout expired, decay / reset the failed attempts count
        if (user.getLockoutUntil() != null && !user.getLockoutUntil().isAfter(now)) {
            user.setLockoutUntil(null);
            user.setFailedLoginAttempts(0);
        }

        int currentAttempts = (user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0) + 1;
        user.setFailedLoginAttempts(currentAttempts);

        int maxFailedAttempts = resolveMaxFailedAttempts();
        int lockoutDurationMinutes = resolveLockoutDurationMinutes();

        boolean isLocked = currentAttempts >= maxFailedAttempts;
        if (isLocked) {
            LocalDateTime lockoutUntil = now.plusMinutes(lockoutDurationMinutes);
            user.setLockoutUntil(lockoutUntil);
            log.warn("Account [{}] temporarily locked due to {} consecutive failed login attempts. Locked until: {}",
                    user.getUsername(), currentAttempts, lockoutUntil);
            auditLogService.record(
                    user.getId(),
                    "ACCOUNT_LOCKED",
                    "USER",
                    user.getId(),
                    null,
                    "Account locked due to " + currentAttempts + " failed login attempts"
            );
        } else {
            log.info("Recorded failed login attempt {}/{} for user [{}]",
                    currentAttempts, maxFailedAttempts, user.getUsername());
        }

        userRepository.save(user);

        // Security Alert Email: Dispatched at 3 attempts (early warning) and at lockout threshold (critical)
        if (currentAttempts == 3 || isLocked) {
            HttpServletRequest currentReq = null;
            RequestAttributes attribs = RequestContextHolder.getRequestAttributes();
            if (attribs instanceof ServletRequestAttributes sra) {
                currentReq = sra.getRequest();
            }
            String rawUserAgent = currentReq != null ? currentReq.getHeader("User-Agent") : null;
            String userAgent = (rawUserAgent != null && rawUserAgent.length() > 500)
                    ? rawUserAgent.substring(0, 500)
                    : rawUserAgent;
            String remoteIp = clientIpResolver.resolveClientIp(currentReq);
            String deviceName = deviceDetectionService.resolveCoarseDeviceName(userAgent);

            emailEventPublisher.publishAfterCommit(EmailEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .eventType(isLocked ? "ACCOUNT_LOCKED_SECURITY_ALERT" : "SUSPICIOUS_LOGIN_WARNING")
                    .emailType(EmailType.SUSPICIOUS_LOGIN)
                    .userId(user.getId())
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .variables(java.util.Map.of(
                            "username", user.getUsername(),
                            "failedAttempts", String.valueOf(currentAttempts),
                            "attackerIp", remoteIp != null ? remoteIp : "Unknown IP",
                            "attackerDevice", deviceName != null ? deviceName : "Unknown Device",
                            "isLocked", String.valueOf(isLocked),
                            "lockoutMinutes", String.valueOf(lockoutDurationMinutes),
                            "secureUrl", resolveClientUrl("/forgot-password")
                    ))
                    .timestamp(LocalDateTime.now())
                    .build());

            log.info("Dispatched unauthorized access security alert email for user [{}] (attempts: {}, locked: {})",
                    user.getUsername(), currentAttempts, isLocked);
        }
    }

    private int resolveMaxFailedAttempts() {
        int fallback = properties.getMaxFailedAttempts();
        return (dynamicSystemConfigReader != null)
                ? dynamicSystemConfigReader.getInt(DynamicSystemConfigKeys.SECURITY_LOCKOUT_MAX_ATTEMPTS, fallback, 1, 50)
                : fallback;
    }

    private int resolveLockoutDurationMinutes() {
        int fallback = properties.getLockoutDurationMinutes();
        return (dynamicSystemConfigReader != null)
                ? dynamicSystemConfigReader.getInt(DynamicSystemConfigKeys.SECURITY_LOCKOUT_DURATION_MINUTES, fallback, 1, 1440)
                : fallback;
    }

    private String resolveClientUrl(String relativePath) {
        if (dynamicSystemConfigReader != null) {
            return dynamicSystemConfigReader.buildClientUrl(relativePath);
        }
        return DynamicSystemConfigKeys.DEFAULT_CLIENT_BASE_URL + relativePath;
    }

    @Override
    @Transactional
    public void handleSuccessfulLogin(User user) {
        if (user == null) {
            return;
        }

        if ((user.getFailedLoginAttempts() != null && user.getFailedLoginAttempts() > 0) || user.getLockoutUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setLockoutUntil(null);
            userRepository.save(user);
            log.info("Reset failed login attempts and cleared lockout for user [{}]", user.getUsername());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isAccountLocked(User user) {
        if (user == null || user.getLockoutUntil() == null) {
            return false;
        }
        return user.getLockoutUntil().isAfter(LocalDateTime.now());
    }

    @Override
    @Transactional
    public void unlockAccount(UUID userId) {
        if (userId == null) {
            return;
        }
        userRepository.findById(userId).ifPresent(user -> {
            user.setFailedLoginAttempts(0);
            user.setLockoutUntil(null);
            userRepository.save(user);
            log.info("Unlocked account and reset failed attempts for user ID: {}", userId);
            auditLogService.record(userId, "ACCOUNT_UNLOCKED", "USER", userId, null, "Account unlocked");
        });
    }
}
