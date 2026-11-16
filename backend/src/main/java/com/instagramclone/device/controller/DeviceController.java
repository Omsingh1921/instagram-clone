package com.instagramclone.device.controller;

import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.device.dto.request.RegisterDeviceRequest;
import com.instagramclone.device.dto.response.DeviceResponse;
import com.instagramclone.device.service.interfaces.IDeviceService;
import com.instagramclone.ratelimit.RateLimit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
@Tag(name = "Device & Push Notifications", description = "Endpoints for managing FCM push notification device tokens")
@SecurityRequirement(name = "bearerAuth")
public class DeviceController {

    private final IDeviceService deviceService;

    @RateLimit(category = "device-register", limit = 20, windowSeconds = 60)
    @PostMapping("/fcm-token")
    @Operation(summary = "Register or refresh FCM device token for current user")
    public ResponseEntity<ApiResponse<DeviceResponse>> registerDevice(
            @Valid @RequestBody RegisterDeviceRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        DeviceResponse response = deviceService.registerDevice(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Device registered for push notifications successfully", response));
    }

    @DeleteMapping("/fcm-token")
    @Operation(summary = "Unregister FCM device token (e.g. on logout)")
    public ResponseEntity<ApiResponse<Void>> unregisterDevice(
            @RequestParam("token") String token) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        deviceService.unregisterDevice(currentUserId, token);
        return ResponseEntity.ok(ApiResponse.success("Device unregistered successfully", (Void) null));
    }

    @DeleteMapping("/device-id/{deviceId}")
    @Operation(summary = "Unregister device by device ID")
    public ResponseEntity<ApiResponse<Void>> unregisterDeviceById(
            @PathVariable("deviceId") String deviceId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        deviceService.unregisterDeviceByDeviceId(currentUserId, deviceId);
        return ResponseEntity.ok(ApiResponse.success("Device unregistered successfully", (Void) null));
    }

    @GetMapping("/me")
    @Operation(summary = "Get all registered push notification devices for current user")
    public ResponseEntity<ApiResponse<List<DeviceResponse>>> getMyDevices() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        List<DeviceResponse> devices = deviceService.getUserDevices(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("User devices retrieved", devices));
    }
}
