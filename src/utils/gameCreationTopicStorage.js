import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GAME_CREATION_TOPICS,
  getGameCreationStorageKey,
  getGameCreationTopicKey,
} from '../constants/notifications';
import { subscribeToTopic, unsubscribeFromTopic } from '../service/notificationService';

export const isGameCreationTopicSubscribed = async (gameName = '') => {
  const gameKey = getGameCreationTopicKey(gameName);
  if (!gameKey) return false;

  const value = await AsyncStorage.getItem(getGameCreationStorageKey(gameKey));
  return value === 'true';
};

export const setGameCreationTopicSubscribed = async (gameName = '', subscribed = false) => {
  const gameKey = getGameCreationTopicKey(gameName);
  if (!gameKey) return false;

  await AsyncStorage.setItem(
    getGameCreationStorageKey(gameKey),
    subscribed ? 'true' : 'false',
  );
  return true;
};

export const resyncGameCreationTopicsFromStorage = async () => {
  const entries = Object.entries(GAME_CREATION_TOPICS);

  await Promise.all(
    entries.map(async ([gameKey, topic]) => {
      const value = await AsyncStorage.getItem(getGameCreationStorageKey(gameKey));
      if (value === 'true') {
        await subscribeToTopic(topic);
      }
    }),
  );
};
