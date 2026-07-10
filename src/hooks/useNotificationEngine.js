import { useEffect } from 'react';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { useAuthStore } from '../store/authStore';
import { getFcmBroadcastTopicForRole } from '../constants/notifications';
import { resyncGameCreationTopicsFromStorage } from '../utils/gameCreationTopicStorage';
import {
  requestNotificationPermission,
  getFCMToken,
  setupNotificationChannel,
  subscribeToBroadcastTopic,
  handleNotificationPress,
  handleForegroundMessage,
} from '../service/notificationService';

export function useNotificationEngine() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isCustomer = useAuthStore((state) => state.isCustomer);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  useEffect(() => {
    if (!isAuthenticated || !isInitialized || (!isCustomer && !isAdmin)) return;

    let isMounted = true;
    const activeUnsubscribers = [];
    const messaging = getMessaging(getApp());

    const startNotificationPipeline = async () => {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission || !isMounted) return;

      await setupNotificationChannel();

      const token = await getFCMToken();
      if (token) {
        await useAuthStore.getState().syncPushToken(token);
      }

      const userRole = useAuthStore.getState().user?.role;
      const broadcastTopic = getFcmBroadcastTopicForRole(userRole);
      try {
        await subscribeToBroadcastTopic(broadcastTopic);
        await resyncGameCreationTopicsFromStorage();
      } catch (error) {
        // Topic sync failures must not prevent the message listeners below
        // from being registered.
        if (__DEV__) console.log('Topic resync error:', error);
      }

      activeUnsubscribers.push(
        onMessage(messaging, async (remoteMessage) => {
          await handleForegroundMessage(remoteMessage);
        }),
      );

      activeUnsubscribers.push(
        onTokenRefresh(messaging, async (newToken) => {
          useAuthStore.getState().syncPushToken(newToken);

          // Topic subscriptions are tied to the FCM token. When it rotates
          // mid-session, re-subscribe level_users/level_admins and the game
          // creation topics or the user silently stops receiving them.
          try {
            const role = useAuthStore.getState().user?.role;
            await subscribeToBroadcastTopic(getFcmBroadcastTopicForRole(role));
            await resyncGameCreationTopicsFromStorage();
          } catch (error) {
            if (__DEV__) console.log('Token refresh topic resync error:', error);
          }
        }),
      );

      activeUnsubscribers.push(
        onNotificationOpenedApp(messaging, (remoteMessage) => {
          handleNotificationPress(remoteMessage?.data);
        }),
      );

      activeUnsubscribers.push(
        notifee.onForegroundEvent(({ type, detail }) => {
          if (type === EventType.PRESS) {
            handleNotificationPress(detail.notification?.data);
          }
        }),
      );

      const initial = await getInitialNotification(messaging);
      if (initial?.data) {
        handleNotificationPress(initial.data);
      } else {
        const notifeeInitial = await notifee.getInitialNotification();
        if (notifeeInitial?.notification?.data) {
          handleNotificationPress(notifeeInitial.notification.data);
        }
      }
    };

    startNotificationPipeline();

    return () => {
      isMounted = false;
      activeUnsubscribers.forEach((unsub) => unsub());
    };
  }, [isAuthenticated, isInitialized, isCustomer, isAdmin]);
}
