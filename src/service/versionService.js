import { Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

// Current app versions - Update these when releasing new versions for each platform
export const CURRENT_IOS_VERSION = 1.0;
export const CURRENT_ANDROID_VERSION = 6.7;

// Get current version based on platform
const getCurrentAppVersion = () => {
  return Platform.OS === 'ios' ? CURRENT_IOS_VERSION : CURRENT_ANDROID_VERSION;
};

// Firestore collection and document IDs
const VERSION_COLLECTION = 'version';
const VERSION_DOC_ID = '8K4k2WbhUMy7arYHv8CJ';
const APP_URL_COLLECTION = 'appUrl';
const APP_URL_DOC_ID = 'NrBVu3mUd1u6S1CC5i5M';

/**
 * Fetches the required app version from Firebase Firestore
 * @returns {Promise<number|null>} The required app version or null if fetch fails
 */
export const getRequiredAppVersion = async () => {
  try {
    const app = getApp();
    const db = getFirestore(app);
    const versionRef = doc(db, VERSION_COLLECTION, VERSION_DOC_ID);
    const versionDoc = await getDoc(versionRef);

    if (versionDoc.exists()) {
      const data = versionDoc.data();
      // Get platform-specific version
      const versionField = Platform.OS === 'ios' ? 'iosVersion' : 'androidVersion';
      return data?.[versionField] ?? null;
    }

    return null;
  } catch (error) {
    if (__DEV__) {
      console.error('Error fetching app version from Firestore:', error);
    }
    return null;
  }
};

/**
 * Checks if the current app version matches the required version
 * @returns {Promise<boolean>} True if update is required, false otherwise
 */
export const checkIfUpdateRequired = async () => {
  try {
    const requiredVersion = await getRequiredAppVersion();

    if (requiredVersion === null) {
      // If we can't fetch version, don't block the user
      return false;
    }

    // Update is required if current version is less than required version
    const currentVersion = getCurrentAppVersion();
    return currentVersion < requiredVersion;
  } catch (error) {
    if (__DEV__) {
      console.error('Error checking app version:', error);
    }
    // On error, don't block the user
    return false;
  }
};

/**
 * Fetches the app store URLs from Firebase Firestore
 * @returns {Promise<{appstoreUrl: string, playstoreUrl: string}|null>} The store URLs or null if fetch fails
 */
export const getAppStoreUrls = async () => {
  try {
    const app = getApp();
    const db = getFirestore(app);
    const urlRef = doc(db, APP_URL_COLLECTION, APP_URL_DOC_ID);
    const urlDoc = await getDoc(urlRef);

    if (urlDoc.exists()) {
      const data = urlDoc.data();
      return {
        appstoreUrl: data?.appstoreUrl ?? 'https://apps.apple.com/us/app/level-esport-matchmaking/id6757985105',
        playstoreUrl: data?.playstoreUrl ?? 'https://play.google.com/store/apps/details?id=com.blackonedevs.levelesportmatchmaking',
      };
    }

    // Fallback URLs if document doesn't exist
    return {
      appstoreUrl: 'https://apps.apple.com/us/app/level-esport-matchmaking/id6757985105',
      playstoreUrl: 'https://play.google.com/store/apps/details?id=com.blackonedevs.levelesportmatchmaking',
    };
  } catch (error) {
    if (__DEV__) {
      console.error('Error fetching app store URLs from Firestore:', error);
    }
    // Return fallback URLs on error
    return {
      appstoreUrl: 'https://apps.apple.com/us/app/level-esport-matchmaking/id6757985105',
      playstoreUrl: 'https://play.google.com/store/apps/details?id=com.blackonedevs.levelesportmatchmaking',
    };
  }
};
