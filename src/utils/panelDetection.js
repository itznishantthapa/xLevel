import { NativeModules, Platform } from 'react-native';

const { AnticheatModule } = NativeModules;

const formatFlaggedWord = (matches) => {
  if (!matches.length) return null;

  return matches
    .map(({ appName, packageName, keyword }) => `${appName}|${packageName}|${keyword}`)
    .join(';');
};

export const scanForPanels = async () => {
  if (Platform.OS !== 'android' || !AnticheatModule?.scanDeviceForPanels) {
    return { flagged: false, apps: [], flagged_word: null };
  }

  try {
    const flaggedApps = await AnticheatModule.scanDeviceForPanels();
    const apps = Array.isArray(flaggedApps) ? flaggedApps : [];
    const flagged = apps.length > 0;

    return {
      flagged,
      apps,
      flagged_word: formatFlaggedWord(apps),
    };
  } catch (error) {
    if (__DEV__) {
      console.error('Panel scan failed:', error);
    }
    return { flagged: false, apps: [], flagged_word: null };
  }
};

export const logPanelDetectionResult = async () => {
  const { flagged, apps, flagged_word } = await scanForPanels();
  console.log('Panel Flagged', flagged);
  if (__DEV__ && apps.length > 0) {
    console.log('Flagged apps:', apps);
    console.log('Flagged word:', flagged_word);
  }
};
