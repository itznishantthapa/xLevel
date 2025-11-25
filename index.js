// index.js
import { registerRootComponent } from 'expo';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';

// ========= Background FCM Handler =========
const messaging = getMessaging(getApp());
setBackgroundMessageHandler(messaging, async remoteMessage => {
  // Pass message to our service (no display here)
  const { handleBackgroundMessage } = require('./src/service/notificationService');
  await handleBackgroundMessage(remoteMessage);
});

// ========= Background Notifee Events =========
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    const { handleNotificationPress } = require('./src/service/notificationService');
    await handleNotificationPress(detail.notification?.data);
  }
});

registerRootComponent(App);
