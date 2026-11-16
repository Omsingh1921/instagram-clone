package com.instagramclone.device.repository;

import com.instagramclone.device.entity.UserDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserDeviceRepository extends JpaRepository<UserDevice, UUID> {

    List<UserDevice> findByUserId(UUID userId);

    @Query("SELECT d FROM UserDevice d WHERE d.user.id IN :userIds")
    List<UserDevice> findByUserIds(@Param("userIds") List<UUID> userIds);

    Optional<UserDevice> findByFcmToken(String fcmToken);

    Optional<UserDevice> findByUserIdAndDeviceId(UUID userId, String deviceId);

    @Modifying
    @Query("DELETE FROM UserDevice d WHERE d.fcmToken = :fcmToken")
    void deleteByFcmToken(@Param("fcmToken") String fcmToken);

    @Modifying
    @Query("DELETE FROM UserDevice d WHERE d.user.id = :userId AND d.deviceId = :deviceId")
    void deleteByUserIdAndDeviceId(@Param("userId") UUID userId, @Param("deviceId") String deviceId);

    @Modifying
    @Query("DELETE FROM UserDevice d WHERE d.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}

