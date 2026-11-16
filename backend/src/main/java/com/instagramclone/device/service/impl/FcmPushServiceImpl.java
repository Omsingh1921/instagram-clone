package com.instagramclone.device.service.impl;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.SendResponse;
import com.google.firebase.messaging.WebpushConfig;
import com.google.firebase.messaging.WebpushNotification;
import com.instagramclone.device.entity.UserDevice;
import com.instagramclone.device.repository.UserDeviceRepository;
import com.instagramclone.device.service.interfaces.IFcmPushService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FcmPushServiceImpl implements IFcmPushService {

    private final UserDeviceRepository userDeviceRepository;

    @Autowired(required = false)
    private FirebaseApp firebaseApp;

    @Override
    @Async
    public void sendPushToUser(UUID recipientId, String title, String body, Map<String, String> data) {
        if (recipientId == null) return;
        List<UserDevice> devices = userDeviceRepository.findByUserId(recipientId);
        if (devices.isEmpty()) {
            log.debug("No registered FCM devices for user: {}", recipientId);
            return;
        }

        List<String> tokens = devices.stream()
                .map(UserDevice::getFcmToken)
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .collect(Collectors.toList());

        if (tokens.isEmpty()) return;

        dispatchPush(tokens, title, body, data);
    }

    @Override
    @Async
    public void sendPushToUsers(List<UUID> recipientIds, String title, String body, Map<String, String> data) {
        if (recipientIds == null || recipientIds.isEmpty()) return;
        List<UserDevice> devices = userDeviceRepository.findByUserIds(recipientIds);
        if (devices.isEmpty()) return;

        List<String> tokens = devices.stream()
                .map(UserDevice::getFcmToken)
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .collect(Collectors.toList());

        if (tokens.isEmpty()) return;

        dispatchPush(tokens, title, body, data);
    }

    @Override
    @Async
    public void sendDirectPush(String fcmToken, String title, String body, Map<String, String> data) {
        if (fcmToken == null || fcmToken.isBlank()) return;
        dispatchPush(List.of(fcmToken), title, body, data);
    }

    private void dispatchPush(List<String> tokens, String title, String body, Map<String, String> data) {
        if (firebaseApp == null) {
            // Graceful simulation mode for local dev without live Firebase keys
            log.info("[FCM SIMULATION] Push sent to {} token(s): Title='{}', Body='{}', Data={}",
                    tokens.size(), title, body, data);
            return;
        }

        try {
            FirebaseMessaging messaging = FirebaseMessaging.getInstance(firebaseApp);

            // Construct Webpush configuration for rich web browser notifications
            WebpushNotification.Builder webpushNotificationBuilder = WebpushNotification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .setIcon("/favicon.ico");

            if (data != null && data.containsKey("avatarUrl")) {
                webpushNotificationBuilder.setImage(data.get("avatarUrl"));
            }

            WebpushConfig webpushConfig = WebpushConfig.builder()
                    .setNotification(webpushNotificationBuilder.build())
                    .putAllData(data != null ? data : Map.of())
                    .build();

            if (tokens.size() == 1) {
                Message.Builder msgBuilder = Message.builder()
                        .setToken(tokens.get(0))
                        .setNotification(Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .setWebpushConfig(webpushConfig);

                if (data != null) {
                    msgBuilder.putAllData(data);
                }

                String response = messaging.send(msgBuilder.build());
                log.debug("Successfully sent FCM single push message: {}", response);
            } else {
                MulticastMessage.Builder multiBuilder = MulticastMessage.builder()
                        .addAllTokens(tokens)
                        .setNotification(Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .setWebpushConfig(webpushConfig);

                if (data != null) {
                    multiBuilder.putAllData(data);
                }

                BatchResponse batchResponse = messaging.sendEachForMulticast(multiBuilder.build());
                log.debug("FCM multicast push dispatched. Success count: {}, Failure count: {}",
                        batchResponse.getSuccessCount(), batchResponse.getFailureCount());

                // Auto-purge stale or unregistered tokens
                if (batchResponse.getFailureCount() > 0) {
                    List<SendResponse> responses = batchResponse.getResponses();
                    List<String> failedTokens = new ArrayList<>();
                    for (int i = 0; i < responses.size(); i++) {
                        if (!responses.get(i).isSuccessful()) {
                            failedTokens.add(tokens.get(i));
                        }
                    }
                    if (!failedTokens.isEmpty()) {
                        cleanStaleTokens(failedTokens);
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Failed to dispatch FCM push notification: {}", ex.getMessage(), ex);
        }
    }

    @Transactional
    public void cleanStaleTokens(List<String> failedTokens) {
        try {
            for (String token : failedTokens) {
                userDeviceRepository.deleteByFcmToken(token);
            }
            log.info("Cleaned up {} expired / invalid FCM device tokens", failedTokens.size());
        } catch (Exception ex) {
            log.warn("Failed to cleanup stale FCM tokens: {}", ex.getMessage());
        }
    }
}

