import api from './api';

const deviceService = {
  /**
   * Register or refresh the FCM device token for the authenticated user
   */
  registerFcmToken: async (fcmToken, deviceType = 'WEB', deviceId = null) => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    const res = await api.post('/devices/fcm-token', {
      fcmToken,
      deviceType,
      deviceId: deviceId || (typeof window !== 'undefined' ? window.localStorage.getItem('ig_device_id') : null),
      userAgent,
    });
    return res?.data?.data || res?.data || res;
  },

  /**
   * Unregister FCM device token (e.g. upon user logout)
   */
  unregisterFcmToken: async (fcmToken) => {
    const res = await api.delete('/devices/fcm-token', {
      params: { token: fcmToken },
    });
    return res?.data?.data || res?.data || res;
  },

  /**
   * Unregister device by device ID
   */
  unregisterDeviceId: async (deviceId) => {
    const res = await api.delete(`/devices/device-id/${deviceId}`);
    return res?.data?.data || res?.data || res;
  },

  /**
   * Get all registered push devices for the current user
   */
  getMyDevices: async () => {
    const res = await api.get('/devices/me');
    return res?.data?.data || res?.data || [];
  },
};

export default deviceService;

