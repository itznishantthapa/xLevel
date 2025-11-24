import { registerRootComponent } from 'expo';
import '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType, AndroidImportance } from '@notifee/react-native';
import App from './App';

// Silence deprecation warnings (optional)
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

//============ Background Message Handler ============
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // Display notification using Notifee for background notifications
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

    await notifee.displayNotification({
      title: title,
      body: body,
      data: data,
      android: androidConfig,
    });
  }
});

//============ Notifee Background Event Handler ============
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    // Handle notification press in background/quit state
    // Navigation will be handled when app opens via getInitialNotification
  }
});

//============ Register Root Component ============
registerRootComponent(App);
