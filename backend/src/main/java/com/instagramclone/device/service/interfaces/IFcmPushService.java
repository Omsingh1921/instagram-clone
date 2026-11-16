package com.instagramclone.device.service.interfaces;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface IFcmPushService {

    /**
     * Send push notification to all active devices registered by the specified user.
     */
    void sendPushToUser(UUID recipientId, String title, String body, Map<String, String> data);

    /**
     * Send multicast push notification to multiple users (e.g. group chat participants).
     */
    void sendPushToUsers(List<UUID> recipientIds, String title, String body, Map<String, String> data);

    /**
     * Direct push to a specific FCM device token.
     */
    void sendDirectPush(String fcmToken, String title, String body, Map<String, String> data);
}

