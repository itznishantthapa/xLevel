// notificationService.js
import { Platform, PermissionsAndroid } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  getToken,
  AuthorizationStatus,
  registerDeviceForRemoteMessages,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification
} from '@react-native-firebase/messaging';

import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationService } from './navigationService';

// ===================================================================
//  PERMISSION
// ===================================================================
export const requestNotificationPermission = async () => {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    if (Platform.OS === 'android') {
      // Check Android version
      if (Platform.Version >= 33) {
        // Android 13+ requires POST_NOTIFICATIONS
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Notification permission denied');
          return false;
        }
      }
      // Android < 13 → skip asking, just register
      await registerDeviceForRemoteMessages(messaging);
      return true;
    }

    // iOS → ask for permission
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Notification permission denied (iOS)');
      return false;
    }

    // iOS auto-registers for remote notifications by default in RNFB unless disabled in firebase.json.
    // Avoid manual registration to prevent warning logs on iOS.
    return true;
  } catch (error) {
    console.log('Permission error:', error);
    return false;
  }
};

// ===================================================================
//  FCM TOKEN
// ===================================================================
export const getFCMToken = async () => {
  try {
    const messaging = getMessaging(getApp());
    return await getToken(messaging);
  } catch {
    return null;
  }
};

// ===================================================================
//  POST FCM TOKEN
// ===================================================================
export const postFCMToken = async () => {
  try {
    const fcmToken = await AsyncStorage.getItem('@fcm_token');
    if (!fcmToken) {
      throw new Error('No authentication token or FCM token found');
    }
    const { API } = await import('../api/client');
    const { endpoints } = await import('../api/endpoints');
    const response = await API.post(endpoints.postFCMToken, { token: fcmToken });
    return response.data;
  } catch (error) {
    if (__DEV__) console.log(error);
    throw error;
  }
};

// ===================================================================
//  DELETE FCM TOKEN
// ===================================================================
export const deleteFCMToken = async () => {
  try {
    const { API } = await import('../api/client');
    const { endpoints } = await import('../api/endpoints');
    const response = await API.delete(endpoints.deleteFCMToken);
    return response.data;
  } catch (error) {
    if (__DEV__) console.log(error);
    throw error;
  }
};

// ===================================================================
//  GET USER NOTIFICATIONS
// ===================================================================
export const getUserNotificationsOnLoads = async (offset = 0, limit = 7) => {
  try {
    const { API } = await import('../api/client');
    const { endpoints } = await import('../api/endpoints');
    const response = await API.get(endpoints.getUserNotificationsOnLoads, { 
      params: { offset, limit } 
    });
    return response.data;
  } catch (error) {
    if (__DEV__) console.log(error);
    throw error;
  }
};

// ===================================================================
//  NAVIGATION
// ===================================================================
export const handleNotificationPress = async (data) => {
  if (!data) return;

  if (data.screen) {
    NavigationService.navigate(data.screen, data);
  } else {
    NavigationService.navigate('customerTabs', { screen: 'HomeTab' });
  }
};

// ===================================================================
//  DUPLICATE FILTER
// ===================================================================
const isDuplicate = async (id) => {
  if (!id) return false;
  const raw = await AsyncStorage.getItem('notif_history');
  const history = raw ? JSON.parse(raw) : [];

  if (history.includes(id)) return true;

  const updated = [...history.slice(-9), id];
  await AsyncStorage.setItem('notif_history', JSON.stringify(updated));

  return false;
};

// ===================================================================
//  DISPLAY NOTIFICATION (Single Source of Truth)
// ===================================================================
const displayNotification = async (data) => {
  if (!data) return;

  const duplicate = await isDuplicate(data.notif_id);
  if (duplicate) return;

  const channelId = `${data.importance || 'high'}_importance`;

  // Build android config dynamically
  const androidConfig = {
    channelId,
    smallIcon: 'ic_notification',
    pressAction: { id: 'default' },
  };

  // Only add largeIcon if it exists
  if (data.largeIcon) {
    androidConfig.largeIcon = data.largeIcon;
  }

  await notifee.displayNotification({
    title: data.title,
    body: data.body,
    data,
    android: androidConfig,
    ios: {
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: data.importance === 'high',
      },
    },
  });
};

// ===================================================================
//  FOREGROUND LISTENER
// ===================================================================
export const setupNotificationListeners = async () => {
  const messaging = getMessaging(getApp());

  // Foreground FCM messages
  const fgUnsub = onMessage(messaging, message =>
    displayNotification(message.data),
  );

  // Foreground Notifee events
  const notifeeUnsub = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      handleNotificationPress(detail.notification?.data);
    }
  });

  // Background → App open
  const openUnsub = onNotificationOpenedApp(messaging, message =>
    handleNotificationPress(message.data),
  );

  // Cold start
  const initial = await getInitialNotification(messaging);
  if (initial?.notification?.title) {
    handleNotificationPress(initial.data);
  }

  return () => {
    fgUnsub();
    notifeeUnsub();
    openUnsub();
  };
};

// ===================================================================
//  BACKGROUND FCM (Called from index.js)
// ===================================================================
export const handleBackgroundMessage = async (remoteMessage) => {
  await displayNotification(remoteMessage?.data);
};

// ===================================================================
//  CHANNELS
// ===================================================================
export const setupNotificationChannel = async () => {
  if (Platform.OS !== 'android') return;

  await notifee.createChannel({
    id: 'high_importance',
    name: 'High Importance Notifications',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [250, 250, 250, 250],
    sound: 'default',
  });

  await notifee.createChannel({
    id: 'normal_importance',
    name: 'Normal Notifications',
    importance: AndroidImportance.DEFAULT,
    vibration: true,
    vibrationPattern: [250, 250],
    sound: 'default',
  });

  await notifee.createChannel({
    id: 'low_importance',
    name: 'Low Importance Notifications',
    importance: AndroidImportance.LOW,
    vibration: false,
  });

  await notifee.createChannel({
    id: 'min_importance',
    name: 'Silent Notifications',
    importance: AndroidImportance.MIN,
    vibration: false,
  });
};
