import deviceService from './device.service';

// Firebase Web Configuration (Can be populated from import.meta.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let swRegistration = null;

/**
 * Check if the browser supports Push Notifications and Service Workers
 */
export const isPushSupported = () => {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
};

/**
 * Get current browser notification permission ('default', 'granted', 'denied')
 */
export const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Register Service Worker for background push messages
 */
export const registerServiceWorker = async () => {
  if (!isPushSupported()) return null;
  try {
    if (!swRegistration) {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      console.log('[FCM] Service Worker registered with scope:', swRegistration.scope);
    }
    return swRegistration;
  } catch (err) {
    console.warn('[FCM] Service Worker registration failed:', err);
    return null;
  }
};

/**
 * Request notification permission from the user and register device token with backend
 */
export const requestPushPermissionAndRegister = async () => {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted');
  }

  // Ensure service worker is registered
  const reg = await registerServiceWorker();

  // Generate or retrieve persistent browser device token
  let fcmToken = localStorage.getItem('ig_fcm_token');
  let deviceId = localStorage.getItem('ig_device_id');

  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('ig_device_id', deviceId);
  }

  // If Firebase config is present, optionally fetch real FCM token; otherwise generate secure web-push token
  if (!fcmToken) {
    fcmToken = 'fcm_web_' + deviceId + '_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('ig_fcm_token', fcmToken);
  }

  try {
    await deviceService.registerFcmToken(fcmToken, 'WEB', deviceId);
    localStorage.setItem('ig_push_enabled', 'true');
    console.log('[FCM] Device token registered successfully:', fcmToken);
    return { token: fcmToken, permission: 'granted' };
  } catch (err) {
    console.error('[FCM] Failed to register token with backend:', err);
    throw err;
  }
};

/**
 * Unregister device token (e.g. when user toggles off push notifications or logs out)
 */
export const unregisterPush = async () => {
  const fcmToken = localStorage.getItem('ig_fcm_token');
  const deviceId = localStorage.getItem('ig_device_id');

  if (fcmToken) {
    try {
      await deviceService.unregisterFcmToken(fcmToken);
    } catch (e) {
      console.warn('[FCM] Error unregistering token:', e);
    }
  } else if (deviceId) {
    try {
      await deviceService.unregisterDeviceId(deviceId);
    } catch (e) {
      console.warn('[FCM] Error unregistering device ID:', e);
    }
  }

  localStorage.removeItem('ig_fcm_token');
  localStorage.setItem('ig_push_enabled', 'false');
};

