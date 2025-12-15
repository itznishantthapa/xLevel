import { Platform } from 'react-native';
import InAppUpdates, { IAUUpdateKind } from 'react-native-in-app-updates';

/**
 * Android-only Play Core in-app update.
 * @param {{ mode?: 'flexible' | 'immediate', allowDev?: boolean }} [options]
 */
export const checkAppUpdate = async (options = {}) => {
  if (Platform.OS !== 'android') return;
  if (__DEV__ && options.allowDev !== true) return;

  const mode = options.mode || 'flexible';
  const updateType = mode === 'immediate' ? IAUUpdateKind.IMMEDIATE : IAUUpdateKind.FLEXIBLE;

  try {
    // Create lazily so a missing/old native build can't crash app startup.
    const inAppUpdates = new InAppUpdates(false);
    const result = await inAppUpdates.checkNeedsUpdate();

    if (result?.shouldUpdate) {
      await inAppUpdates.startUpdate({ updateType });
    }
  } catch (__error) {
    // no-op (avoid crashing on Play Services / store edge cases)
  }
};
