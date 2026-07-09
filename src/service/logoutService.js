import AsyncStorage from '@react-native-async-storage/async-storage';
import { persister, queryClient } from '../lib/queryClient';
import { checkFCMTokenInStorage } from '../utils/tokenUtils';
import { deleteFCMToken } from './notificationService';

let isHandlingSessionExpiry = false;

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

    await performLogout(false);

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
 * - Removes FCM token if exists
 * - Clears all stored authentication data
 * - Resets authentication state
 * @returns {Promise<void>}
 */
export const performLogout = async (deleteToken=true) => {
  try {
    // Step 1: Clear all React Query cache and reset queries
    queryClient.clear();
    // 2. Clear persisted cache in AsyncStorage
    await persister.removeClient();   // 👈 important!


    // Step 2: Remove FCM token if it exists
    if (deleteToken) {
    const hasToken = await checkFCMTokenInStorage();
    if (hasToken) {
      await deleteFCMToken();
    }
    }


    // Step 3: Clear all stored authentication data
    await AsyncStorage.multiRemove([
      '@access_token',
      '@refresh_token',
      '@user',
      '@fcm_token' // Also clear FCM token from storage
    ]);


    // Step 4: Small delay to ensure all operations complete
    await new Promise((resolve) => setTimeout(resolve, 400));

  } catch (error) {

    if (__DEV__) {
      console.log('Error during logout:', error);
    }

  }
};

