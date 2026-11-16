package com.instagramclone.security.service.interfaces;

import java.util.UUID;

public interface IPrivacyService {

    boolean isBlockedBidirectional(UUID userA, UUID userB);

    void validateBlockStatus(UUID viewerId, UUID targetUserId);

    boolean isAccountPrivate(UUID userId);

    boolean canViewUserContent(UUID viewerId, UUID targetUserId);

    void validateCanViewUserContent(UUID viewerId, UUID targetUserId);
}
