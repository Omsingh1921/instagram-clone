package com.instagramclone.device.service.impl;

import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.device.dto.request.RegisterDeviceRequest;
import com.instagramclone.device.dto.response.DeviceResponse;
import com.instagramclone.device.entity.UserDevice;
import com.instagramclone.device.enums.DeviceType;
import com.instagramclone.device.repository.UserDeviceRepository;
import com.instagramclone.device.service.interfaces.IDeviceService;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceServiceImpl implements IDeviceService {

    private final UserDeviceRepository userDeviceRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public DeviceResponse registerDevice(UUID userId, RegisterDeviceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Optional<UserDevice> existing = userDeviceRepository.findByFcmToken(request.getFcmToken());
        UserDevice device;

        if (existing.isPresent()) {
            device = existing.get();
            device.setUser(user);
            device.setDeviceType(request.getDeviceType() != null ? request.getDeviceType() : DeviceType.WEB);
            if (request.getDeviceId() != null) device.setDeviceId(request.getDeviceId());
            if (request.getUserAgent() != null) device.setUserAgent(request.getUserAgent());
            device.setLastActiveAt(LocalDateTime.now());
            log.info("Updated existing FCM device token for user: {}", user.getUsername());
        } else {
            device = UserDevice.builder()
                    .user(user)
                    .fcmToken(request.getFcmToken())
                    .deviceType(request.getDeviceType() != null ? request.getDeviceType() : DeviceType.WEB)
                    .deviceId(request.getDeviceId())
                    .userAgent(request.getUserAgent())
                    .lastActiveAt(LocalDateTime.now())
                    .build();
            log.info("Registered new FCM device token for user: {}", user.getUsername());
        }

        UserDevice saved = userDeviceRepository.save(device);
        return toDeviceResponse(saved);
    }

    @Override
    @Transactional
    public void unregisterDevice(UUID userId, String fcmToken) {
        userDeviceRepository.deleteByFcmToken(fcmToken);
        log.info("Unregistered FCM device token for user: {}", userId);
    }

    @Override
    @Transactional
    public void unregisterDeviceByDeviceId(UUID userId, String deviceId) {
        userDeviceRepository.deleteByUserIdAndDeviceId(userId, deviceId);
        log.info("Unregistered FCM device with deviceId {} for user: {}", deviceId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeviceResponse> getUserDevices(UUID userId) {
        return userDeviceRepository.findByUserId(userId).stream()
                .map(this::toDeviceResponse)
                .collect(Collectors.toList());
    }

    private DeviceResponse toDeviceResponse(UserDevice device) {
        return DeviceResponse.builder()
                .id(device.getId())
                .fcmToken(device.getFcmToken())
                .deviceType(device.getDeviceType())
                .deviceId(device.getDeviceId())
                .userAgent(device.getUserAgent())
                .lastActiveAt(device.getLastActiveAt())
                .createdAt(device.getCreatedAt())
                .build();
    }
}

