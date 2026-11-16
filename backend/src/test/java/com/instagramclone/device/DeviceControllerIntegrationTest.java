package com.instagramclone.device;

import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.device.dto.request.RegisterDeviceRequest;
import com.instagramclone.device.entity.UserDevice;
import com.instagramclone.device.enums.DeviceType;
import com.instagramclone.device.repository.UserDeviceRepository;
import com.instagramclone.device.service.interfaces.IFcmPushService;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DeviceControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private IFcmPushService fcmPushService;

    private User testUser;
    private String userToken;

    @BeforeEach
    void setUp() {
        cleanDatabase();
        userDeviceRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        testUser = userRepository.save(User.builder()
                .username("dev_user_" + suffix)
                .email("dev_" + suffix + "@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        userToken = jwtTokenProvider.generateTokenForUser(testUser.getId(), testUser.getUsername(), testUser.getEmail());
    }

    @Test
    @DisplayName("FCM Push - Should register new device token successfully")
    void registerDevice_ShouldPersistToken() throws Exception {
        RegisterDeviceRequest request = RegisterDeviceRequest.builder()
                .fcmToken("fcm_test_token_12345")
                .deviceType(DeviceType.WEB)
                .deviceId("browser_device_01")
                .userAgent("Mozilla/5.0 Chrome")
                .build();

        mockMvc.perform(post("/api/v1/devices/fcm-token")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fcmToken").value("fcm_test_token_12345"))
                .andExpect(jsonPath("$.data.deviceType").value("WEB"))
                .andExpect(jsonPath("$.data.deviceId").value("browser_device_01"));

        List<UserDevice> devices = userDeviceRepository.findByUserId(testUser.getId());
        assertThat(devices).hasSize(1);
        assertThat(devices.get(0).getFcmToken()).isEqualTo("fcm_test_token_12345");
    }

    @Test
    @DisplayName("FCM Push - Should retrieve registered devices for user")
    void getMyDevices_ShouldReturnDeviceList() throws Exception {
        UserDevice device = UserDevice.builder()
                .user(testUser)
                .fcmToken("fcm_existing_token_999")
                .deviceType(DeviceType.WEB)
                .deviceId("device_existing")
                .build();
        userDeviceRepository.save(device);

        mockMvc.perform(get("/api/v1/devices/me")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].fcmToken").value("fcm_existing_token_999"));
    }

    @Test
    @DisplayName("FCM Push - Should unregister device token successfully")
    void unregisterDevice_ShouldDeleteToken() throws Exception {
        UserDevice device = UserDevice.builder()
                .user(testUser)
                .fcmToken("fcm_to_delete_777")
                .deviceType(DeviceType.WEB)
                .build();
        userDeviceRepository.save(device);

        mockMvc.perform(delete("/api/v1/devices/fcm-token")
                        .header("Authorization", "Bearer " + userToken)
                        .param("token", "fcm_to_delete_777"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(userDeviceRepository.findByFcmToken("fcm_to_delete_777")).isEmpty();
    }

    @Test
    @DisplayName("FCM Push - Service should execute simulated push without throwing error")
    void sendPushToUser_ShouldExecuteGracefully() {
        fcmPushService.sendPushToUser(
                testUser.getId(),
                "Instagram",
                "You have a new follower",
                Map.of("type", "FOLLOW")
        );
        assertThat(true).isTrue();
    }

    @Test
    @DisplayName("FCM Push - Should fail validation on blank fcmToken")
    void registerDevice_BlankToken_ShouldReturnBadRequest() throws Exception {
        RegisterDeviceRequest request = RegisterDeviceRequest.builder()
                .fcmToken("")
                .deviceType(DeviceType.WEB)
                .build();

        mockMvc.perform(post("/api/v1/devices/fcm-token")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("FCM Push - Should fail validation on token with whitespace")
    void registerDevice_TokenWithWhitespace_ShouldReturnBadRequest() throws Exception {
        RegisterDeviceRequest request = RegisterDeviceRequest.builder()
                .fcmToken("invalid token with spaces")
                .deviceType(DeviceType.WEB)
                .build();

        mockMvc.perform(post("/api/v1/devices/fcm-token")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
