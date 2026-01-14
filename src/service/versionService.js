import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

// Current app version - Update this when releasing new versions
export const CURRENT_APP_VERSION = 1.2;

// Firestore collection and document IDs
const VERSION_COLLECTION = 'version';
const VERSION_DOC_ID = '8K4k2WbhUMy7arYHv8CJ';

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
      return data?.appVersion ?? null;
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
    return CURRENT_APP_VERSION < requiredVersion;
  } catch (error) {
    if (__DEV__) {
      console.error('Error checking app version:', error);
    }
    // On error, don't block the user
    return false;
  }
};
