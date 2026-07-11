import { getDeviceData } from './deviceData';
import { scanForPanels } from './panelDetection';

export const getAuthMetadata = async () => {
  const [{ deviceId, platform }, { flagged }] = await Promise.all([
    getDeviceData(),
    scanForPanels(),
  ]);

  if (__DEV__) {
    console.log('Panel Flagged', flagged);
  }

  return {
    device_id: deviceId,
    platform,
    is_flagged: flagged,
  };
};
