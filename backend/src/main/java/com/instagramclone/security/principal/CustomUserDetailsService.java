package com.instagramclone.security.principal;

import com.instagramclone.admin.constants.DynamicSystemConfigKeys;
import com.instagramclone.admin.service.interfaces.IDynamicSystemConfigReader;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Autowired(required = false)
    private IDynamicSystemConfigReader dynamicSystemConfigReader;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            throw new UsernameNotFoundException("Username or email cannot be empty");
        }

        String normalized = usernameOrEmail.trim().toLowerCase(java.util.Locale.ROOT);
        int cooldownDays = (dynamicSystemConfigReader != null)
                ? dynamicSystemConfigReader.getInt(DynamicSystemConfigKeys.USER_USERNAME_COOLDOWN_DAYS, com.instagramclone.user.constants.UserConstants.USERNAME_CHANGE_COOLDOWN_DAYS, 0, 365)
                : com.instagramclone.user.constants.UserConstants.USERNAME_CHANGE_COOLDOWN_DAYS;
        int graceDays = (dynamicSystemConfigReader != null)
                ? dynamicSystemConfigReader.getInt(DynamicSystemConfigKeys.USER_ACCOUNT_DELETION_GRACE_DAYS, com.instagramclone.user.constants.UserConstants.ACCOUNT_DELETION_GRACE_PERIOD_DAYS, 1, 180)
                : com.instagramclone.user.constants.UserConstants.ACCOUNT_DELETION_GRACE_PERIOD_DAYS;

        if (!normalized.contains("@")) {
            User user = userRepository.findByUsername(normalized)
                    .or(() -> userRepository.findByPreviousUsernameReservedAfter(normalized, java.time.LocalDateTime.now().minusDays(cooldownDays)))
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + usernameOrEmail));
            if (user.isPermanentlyDeleted(graceDays)) {
                throw new UsernameNotFoundException("User not found with username: " + usernameOrEmail);
            }
            return UserPrincipal.create(user);
        }

        // Email address provided: only authenticate if exactly one account is associated
        java.util.List<User> accounts = userRepository.findAllByEmail(normalized);
        java.util.List<User> eligibleAccounts = accounts.stream()
                .filter(u -> !u.isPermanentlyDeleted(graceDays))
                .toList();

        if (eligibleAccounts.isEmpty()) {
            throw new UsernameNotFoundException("User not found with email: " + usernameOrEmail);
        }

        if (eligibleAccounts.size() == 1) {
            return UserPrincipal.create(eligibleAccounts.get(0));
        }

        // Ambiguous email associated with multiple accounts:
        // Reject with generic UsernameNotFoundException to maintain 401 INVALID_CREDENTIALS and timing equalization
        log.warn("Login attempt using shared email [{}] rejected: {} active accounts share this email address",
                maskEmail(normalized), eligibleAccounts.size());
        throw new UsernameNotFoundException("Invalid credentials for ambiguous email identifier: " + usernameOrEmail);
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIdx = email.indexOf('@');
        String local = email.substring(0, atIdx);
        String domain = email.substring(atIdx);
        if (local.length() <= 2) return local.charAt(0) + "***" + domain;
        return local.charAt(0) + "***" + local.charAt(local.length() - 1) + domain;
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        return UserPrincipal.create(user);
    }
}
