import { getDeviceData } from './deviceData';
import { scanForPanels } from './panelDetection';

export const getAuthMetadata = async () => {
  const [{ deviceId, platform }, { flagged, flagged_word }] = await Promise.all([
    getDeviceData(),
    scanForPanels(),
  ]);

  if (__DEV__) {
    console.log('Panel Flagged', flagged);
    if (flagged_word) {
      console.log('Flagged word:', flagged_word);
    }
  }

  return {
    device_id: deviceId,
    platform,
    is_flagged: flagged,
    flagged_word,
  };
};
