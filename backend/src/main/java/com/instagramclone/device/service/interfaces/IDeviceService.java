package com.instagramclone.device.service.interfaces;

import com.instagramclone.device.dto.request.RegisterDeviceRequest;
import com.instagramclone.device.dto.response.DeviceResponse;

import java.util.List;
import java.util.UUID;

public interface IDeviceService {

    DeviceResponse registerDevice(UUID userId, RegisterDeviceRequest request);

    void unregisterDevice(UUID userId, String fcmToken);

    void unregisterDeviceByDeviceId(UUID userId, String deviceId);

    List<DeviceResponse> getUserDevices(UUID userId);
}

