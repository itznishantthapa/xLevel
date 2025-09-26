import { getApp } from '@react-native-firebase/app';
import {
  messaging,
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
import * as Notifications from 'expo-notifications';




//========== Request Notification Permission ============
export const requestNotificationPermission = async () => {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        if (__DEV__) console.log('We are unable to grant the notification permission !')
        return false;
      }
    }

    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      if (__DEV__) console.log('We are unable to grant the notification permission !')
      return false;
    }

    await registerDeviceForRemoteMessages(messaging);
    return true;
  } catch (error) {
    if (__DEV__) console.log(error)
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
    NavigationService.navigate('notify');
  }
};





//========== Setup Notification Listeners ============
export const setupNotificationListeners = async () => {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    // Foreground message handler
    const unsubscribeOnMessage = onMessage(messaging, async remoteMessage => {
      if (remoteMessage?.notification) {
        const { title, body } = remoteMessage.notification;
        const payloadData = remoteMessage.data || {};

        // show popup using expo-notifications in foreground, implement this after the Notifications.setNotificationHandler()
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title,
            body: body,
            data: payloadData,            //<--------- this is the data that will be passed to the screen and used in navigation on tap
            channelId: 'high_importance',
            
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 2,
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
    };
  } catch (error) {
    if (__DEV__) console.log(error)
  }
};



//========== Setup Notification Channel ============
export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('high_importance', {
      name: 'High Importance Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
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