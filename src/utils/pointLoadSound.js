import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const POINT_LOAD_SOUND = require('../assets/pointloadsound.mp3');

let pointLoadPlayer = null;
let audioModeConfigured = false;

const ensurePointLoadAudioMode = async () => {
  if (audioModeConfigured) return;

  await setAudioModeAsync({
    playsInSilentMode: true,
  });
  audioModeConfigured = true;
};

export const playPointLoadSound = async () => {
  try {
    await ensurePointLoadAudioMode();

    if (!pointLoadPlayer) {
      pointLoadPlayer = createAudioPlayer(POINT_LOAD_SOUND);
    }

    await pointLoadPlayer.seekTo(0);
    pointLoadPlayer.play();
  } catch (error) {
    if (__DEV__) console.log('Point load sound error:', error);
  }
};
