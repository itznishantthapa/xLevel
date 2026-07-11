import { NativeModules, Platform } from 'react-native';

const { AnticheatModule } = NativeModules;

export const scanForPanels = async () => {
  if (Platform.OS !== 'android' || !AnticheatModule?.scanDeviceForPanels) {
    return { flagged: false, apps: [] };
  }

  try {
    const flaggedApps = await AnticheatModule.scanDeviceForPanels();
    const apps = Array.isArray(flaggedApps) ? flaggedApps : [];
    return { flagged: apps.length > 0, apps };
  } catch (error) {
    if (__DEV__) {
      console.error('Panel scan failed:', error);
    }
    return { flagged: false, apps: [] };
  }
};

export const logPanelDetectionResult = async () => {
  const { flagged, apps } = await scanForPanels();
  console.log('Panel Flagged', flagged);
  if (__DEV__ && apps.length > 0) {
    console.log('Flagged apps:', apps);
  }
};
