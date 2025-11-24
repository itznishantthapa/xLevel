import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
  getToken,
  AuthorizationStatus,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { API } from '../api/client';
import { endpoints } from '../api/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import { NavigationService } from './navigationService';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';




//========== Request Notification Permission ============
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





//========== Get FCM Token ============
export const getFCMToken = async () => {
  try {
    const app = getApp();
    const messaging = getMessaging(app);
    const fcmToken = await getToken(messaging);
    return fcmToken;
  } catch (error) {
    if (__DEV__) console.log(error)
    return null;
  }
};






//========== Handle Navigation ============
const handleNotificationNavigation = (remoteMessage) => {
  const screen = remoteMessage?.data?.screen;
  if (screen) {
    NavigationService.navigate(screen, remoteMessage.data);
  } else if (remoteMessage?.notification) {
    NavigationService.navigate('customerTabs', { screen: 'HomeTab' });
  }
};





//========== Setup Notification Listeners ============
export const setupNotificationListeners = async () => {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    // Setup Notifee foreground event handler
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const remoteMessage = {
          data: detail.notification?.data,
          notification: {
            title: detail.notification?.title,
            body: detail.notification?.body,
          },
        };
        handleNotificationNavigation(remoteMessage);
      }
    });

    // Foreground message handler
    const unsubscribeOnMessage = onMessage(messaging, async remoteMessage => {
      const data = remoteMessage?.data;
      
      if (data) {
        const title = data.title || remoteMessage?.notification?.title;
        const body = data.body || remoteMessage?.notification?.body;
        const largeIcon = data.largeIcon;
        const importance = data.importance || 'high';

        // Map importance to channel ID
        const channelId = `${importance}_importance`;

        // Build android config
        const androidConfig = {
          channelId: channelId,
          smallIcon: 'ic_notification',
          pressAction: {
            id: 'default',
          },
        };

        // Only add largeIcon if it exists
        if (largeIcon) {
          androidConfig.largeIcon = largeIcon;
        }

        // Display notification using Notifee
        await notifee.displayNotification({
          title: title,
          body: body,
          data: data,
          android: androidConfig,
          ios: {
            foregroundPresentationOptions: {
              alert: true,
              badge: true,
              sound: importance === 'high',
            },
          },
        });
      }
    });

    // Background notification opened handler
    const unsubscribeOnNotificationOpened = onNotificationOpenedApp(messaging, remoteMessage => {
      handleNotificationNavigation(remoteMessage);
    });

    // Check if app was opened from a quit state
    const initialNotification = await getInitialNotification(messaging);
    if (initialNotification) {
      handleNotificationNavigation(initialNotification);
    }

    // Return cleanup function
    return () => {
      unsubscribeOnMessage();
      unsubscribeOnNotificationOpened();
      unsubscribeNotifee();
    };
  } catch (error) {
    if (__DEV__) console.log(error)
  }
};



//========== Setup Notification Channel ============
export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    // High importance channel - shows as popup/heads-up notification
    await notifee.createChannel({
      id: 'high_importance',
      name: 'High Importance Notifications',
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [250, 250, 250, 250],
      sound: 'default',
    });

    // Normal importance channel - shows in notification tray only
    await notifee.createChannel({
      id: 'normal_importance',
      name: 'Normal Notifications',
      importance: AndroidImportance.DEFAULT,
      vibration: true,
      vibrationPattern: [250, 250],
      sound: 'default',
    });

    // Low importance channel - shows silently in notification tray
    await notifee.createChannel({
      id: 'low_importance',
      name: 'Low Importance Notifications',
      importance: AndroidImportance.LOW,
      vibration: false,
    });

    // Min importance channel - minimal notification
    await notifee.createChannel({
      id: 'min_importance',
      name: 'Silent Notifications',
      importance: AndroidImportance.MIN,
      vibration: false,
    });
  }
};






//========== Post FCM Token ============
export const postFCMToken = async () => {
  try {
    const fcmToken = await AsyncStorage.getItem('@fcm_token');
    if (!fcmToken) {
      throw new Error('No authentication token or FCM token found');
    }
    const response = await API.post(endpoints.postFCMToken, { token: fcmToken });

    return response.data;
  } catch (error) {
    if (__DEV__) console.log(error)
  }
};




//========== Delete FCM Token ============
export const deleteFCMToken = async () => {
  try {
    const response = await API.delete(endpoints.deleteFCMToken);
    return response.data;
  } catch (error) {
    if (__DEV__) console.log(error)
    throw error;
  }
};



//========== Get User Notifications ============
export const getUserNotificationsOnLoads = async (offset = 0, limit = 7) => {
  try {
    const response = await API.get(endpoints.getUserNotificationsOnLoads, { params: { offset, limit } });
    return response.data;
  } catch (error) {
    if (__DEV__) console.log(error)
  }
};