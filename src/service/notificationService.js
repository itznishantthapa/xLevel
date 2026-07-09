// notificationService.js
import { Platform, PermissionsAndroid } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  getToken,
  AuthorizationStatus,
  registerDeviceForRemoteMessages,
  subscribeToTopic as fcmSubscribeToTopic,
  unsubscribeFromTopic as fcmUnsubscribeFromTopic,
} from '@react-native-firebase/messaging';

import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationService } from './navigationService';
import { FCM_USER_TOPIC, shouldRefreshPointsDataOnNotification, getGameCreationTitleKey, getGameCreationTopicKey, getCreatorUsernameFromGameCreationBody, isGameCreationNotificationTitle } from '../constants/notifications';

// ===================================================================
//  PERMISSION
// ===================================================================
export const requestNotificationPermission = async () => {
  try {
    const messaging = getMessaging(getApp());

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) return false;
    }

    if (Platform.OS === 'ios') {
      const authStatus = await requestPermission(messaging);
      const hasPermission =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!hasPermission) return false;
    }

    if (Platform.OS === 'android') {
      await registerDeviceForRemoteMessages(messaging);
    }

    return true;
  } catch (error) {
    if (__DEV__) console.error('Permission error:', error);
    return false;
  }
};

// ===================================================================
//  FCM TOKEN
// ===================================================================
export const getFCMToken = async () => {
  try {
    const token = await getToken(getMessaging(getApp()));
    return token;
  } catch (error) {
    if (__DEV__) console.error('FCM token error:', error);
    return null;
  }
};

// ===================================================================
//  FCM TOPICS
// ===================================================================
export const subscribeToTopic = async (topic) => {
  try {
    await fcmSubscribeToTopic(getMessaging(getApp()), topic);

    if (topic === FCM_USER_TOPIC) {
      console.log('level_users notification is subscribed');
    } else {
      console.log(`${topic} notification is subscribed`);
    }

    return true;
  } catch (error) {
    if (__DEV__) console.error(`Topic subscription error (${topic}):`, error);
    return false;
  }
};

export const unsubscribeFromTopic = async (topic) => {
  try {
    await fcmUnsubscribeFromTopic(getMessaging(getApp()), topic);
    return true;
  } catch (error) {
    if (__DEV__) console.error(`Topic unsubscription error (${topic}):`, error);
    return false;
  }
};

export const subscribeToBroadcastTopic = async (topic = FCM_USER_TOPIC) => {
  return subscribeToTopic(topic);
};

export const unsubscribeFromBroadcastTopic = async (topic = FCM_USER_TOPIC) => {
  return unsubscribeFromTopic(topic);
};

// ===================================================================
//  POST FCM TOKEN
// ===================================================================
export const postFCMToken = async (tokenOverride) => {
  try {
    const fcmToken = tokenOverride || (await AsyncStorage.getItem('@fcm_token'));
    if (!fcmToken) {
      throw new Error('No FCM token found');
    }
    const { API } = await import('../api/client');
    const { endpoints } = await import('../api/endpoints');
    const response = await API.post(endpoints.postFCMToken, { token: fcmToken });
    console.log('FCM token synced to backend');
    return response.data;
  } catch (error) {
    if (__DEV__) console.log('postFCMToken error:', error);
    throw error;
  }
};

export const syncFCMTokenWithBackend = async () => {
  const token = await getFCMToken();
  if (!token) return false;

  const { useAuthStore } = await import('../store/authStore');
  await useAuthStore.getState().syncPushToken(token);
  return true;
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
      params: { offset, limit },
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

  await new Promise((resolve) => setTimeout(resolve, 500));

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

  const androidConfig = {
    channelId,
    smallIcon: 'ic_notification',
    pressAction: { id: 'default' },
    sound: 'custom_sound',
    style: data.bigImage
      ? {
          type: AndroidStyle.BIGPICTURE,
          picture: data.bigImage,
        }
      : {
          type: AndroidStyle.BIGTEXT,
          text: data.body || '',
        },
  };

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
//  USER REFRESH (foreground notifications)
// ===================================================================
const refreshUserOnForegroundNotification = async (title) => {
  if (!shouldRefreshPointsDataOnNotification(title)) return;

  try {
    const { useAuthStore } = await import('../store/authStore');
    const { isAuthenticated, get_user } = useAuthStore.getState();
    if (!isAuthenticated) return;

    await get_user();

    const { queryClient } = await import('../lib/queryClient');
    await queryClient.invalidateQueries({ queryKey: ['points'] });
  } catch (error) {
    if (__DEV__) console.log('Foreground notification user refresh error:', error);
  }
};

const getNotificationTitle = (message) =>
  message?.data?.title || message?.notification?.title || '';

const getNotificationBody = (message) =>
  message?.data?.body || message?.notification?.body || '';

const shouldSkipOwnGameCreationNotification = async (title, body) => {
  if (!isGameCreationNotificationTitle(title)) return false;

  const gameKey = getGameCreationTitleKey(title);
  if (!gameKey) return false;

  const notifiedUsername = getCreatorUsernameFromGameCreationBody(body);
  if (!notifiedUsername) return false;

  try {
    const { useAuthStore } = await import('../store/authStore');
    const user = useAuthStore.getState().user;
    if (!user?.id) return false;

    const { queryClient } = await import('../lib/queryClient');
    const profiles = queryClient.getQueryData(['gameProfiles', user.id]) ?? [];
    const ownProfile = profiles.find(
      (profile) => getGameCreationTopicKey(profile?.game_name) === gameKey,
    );
    const ownUsername = ownProfile?.game_username?.trim();

    if (!ownUsername) return false;

    return notifiedUsername.toLowerCase() === ownUsername.toLowerCase();
  } catch (error) {
    if (__DEV__) console.log('Own game creation notification check error:', error);
    return false;
  }
};

export const handleForegroundMessage = async (message) => {
  const title = getNotificationTitle(message);
  const body = getNotificationBody(message);

  if (await shouldSkipOwnGameCreationNotification(title, body)) {
    return;
  }

  await displayNotification(message?.data);
  await refreshUserOnForegroundNotification(title);
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
    sound: 'custom_sound',
  });

  await notifee.createChannel({
    id: 'normal_importance',
    name: 'Normal Notifications',
    importance: AndroidImportance.DEFAULT,
    vibration: true,
    vibrationPattern: [250, 250],
    sound: 'custom_sound',
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
