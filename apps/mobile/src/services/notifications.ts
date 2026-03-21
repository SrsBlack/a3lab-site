/**
 * Push notification service.
 *
 * Handles Expo push notification registration, permission requests,
 * incoming notification display, and notification tap deep linking.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import client from './api';

// ─── Configuration ───────────────────────────────────

// Show notifications while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ─── Registration ────────────────────────────────────

/**
 * Register for push notifications and send the token to the API.
 * Returns the Expo push token string, or null if registration fails.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications require a physical device');
    return null;
  }

  // Request permission on iOS
  if (Platform.OS === 'ios') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'PROOF',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#000000',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Send the token to our API
    await client.post('/users/push-token', { token });

    return token;
  } catch (err) {
    console.error('[Notifications] Failed to get push token:', err);
    return null;
  }
}

// ─── Deep linking ────────────────────────────────────

/**
 * Handle a notification tap by navigating to the relevant screen.
 */
function handleNotificationTap(notification: Notifications.Notification): void {
  const data = notification.request.content.data;

  if (!data) return;

  if (data.postId && typeof data.postId === 'string') {
    router.push(`/post/${data.postId}`);
    return;
  }

  if (data.screen === 'trust') {
    router.push('/trust');
    return;
  }
}

// ─── Listeners ───────────────────────────────────────

/**
 * Set up notification listeners for foreground display and tap handling.
 * Call this once at app startup. Returns a cleanup function.
 */
export function setupNotificationListeners(): () => void {
  // Fires when a notification is received while the app is in the foreground
  const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
    // Notification is displayed automatically via the handler above.
    // Log for debugging.
    console.log('[Notifications] Received:', notification.request.content.title);
  });

  // Fires when the user taps on a notification
  const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationTap(response.notification);
  });

  // Check if the app was opened from a notification (cold start)
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      handleNotificationTap(response.notification);
    }
  });

  // Return cleanup function
  return () => {
    foregroundSub.remove();
    tapSub.remove();
  };
}
