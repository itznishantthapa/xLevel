import AsyncStorage from '@react-native-async-storage/async-storage';
import { persister, queryClient } from '../lib/queryClient';
import {
  GAME_CREATION_TOPICS,
  getFcmBroadcastTopicForRole,
  getGameCreationStorageKey,
} from '../constants/notifications';
import { checkFCMTokenInStorage } from '../utils/tokenUtils';
import {
  deleteFCMToken,
  unsubscribeFromBroadcastTopic,
  unsubscribeFromTopic,
} from './notificationService';

let isHandlingSessionExpiry = false;

const clearLocalAuthData = async () => {
  await AsyncStorage.multiRemove([
    '@access_token',
    '@refresh_token',
    '@user',
    '@fcm_token',
  ]);
};

const unsubscribeUserTopics = async () => {
  try {
    const userJson = await AsyncStorage.getItem('@user');
    const user = userJson ? JSON.parse(userJson) : null;
    const broadcastTopic = getFcmBroadcastTopicForRole(user?.role);

    await unsubscribeFromBroadcastTopic(broadcastTopic);

    await Promise.all(
      Object.entries(GAME_CREATION_TOPICS).map(async ([gameKey, topic]) => {
        const value = await AsyncStorage.getItem(getGameCreationStorageKey(gameKey));
        if (value === 'true') {
          await unsubscribeFromTopic(topic);
        }
      }),
    );
  } catch (error) {
    if (__DEV__) {
      console.log('FCM topic unsubscription error:', error);
    }
  }
};

const removeFcmTokenFromBackend = async () => {
  try {
    const hasToken = await checkFCMTokenInStorage();
    if (hasToken) {
      await deleteFCMToken();
    }
  } catch (error) {
    if (__DEV__) {
      console.log('deleteFCMToken error:', error);
    }
  }
};

/**
 * Clears app state and sends the user back to login when the session expires.
 */
export const handleSessionExpired = async () => {
  if (isHandlingSessionExpiry) return;

  isHandlingSessionExpiry = true;
  try {
    const { useAuthStore } = await import('../store/authStore');
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) return;

    await performLogout(true);

    useAuthStore.setState({
      user: null,
      isAdmin: false,
      isCustomer: false,
      isAuthenticated: false,
      isInitialized: true,
    });
  } catch (error) {
    if (__DEV__) {
      console.log('handleSessionExpired error:', error);
    }
  } finally {
    isHandlingSessionExpiry = false;
  }
};

/**
 * Centralized logout function that handles all cleanup tasks
 * - Clears all React Query cache and resets queries
 * - Unsubscribes from FCM broadcast and game-creation topics
 * - Removes FCM token from backend if it exists
 * - Clears all stored authentication data
 * @returns {Promise<void>}
 */
export const performLogout = async (deleteToken = true) => {
  try {
    queryClient.clear();
    await persister.removeClient();

    if (deleteToken) {
      await unsubscribeUserTopics();
      await removeFcmTokenFromBackend();
    }

    await clearLocalAuthData();
    await new Promise((resolve) => setTimeout(resolve, 400));
  } catch (error) {
    if (__DEV__) {
      console.log('Error during logout:', error);
    }

    try {
      await clearLocalAuthData();
    } catch (clearError) {
      if (__DEV__) {
        console.log('Error clearing local auth data:', clearError);
      }
    }
  }
};
