import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GAME_USER_TOPICS,
  getGameCreationTopicKey,
  getGameUserStorageKey,
  getGameUserTopic,
} from '../constants/notifications';
import { hasNotificationPermission, subscribeToTopic, unsubscribeFromTopic } from '../service/notificationService';

export const subscribeToGameUserTopicIfPermitted = async (gameName = '') => {
  const gameKey = getGameCreationTopicKey(gameName);
  const topic = getGameUserTopic(gameName);

  if (!gameKey || !topic) return false;

  const permitted = await hasNotificationPermission();
  if (!permitted) return false;

  const success = await subscribeToTopic(topic);
  if (success) {
    await AsyncStorage.setItem(getGameUserStorageKey(gameKey), 'true');
  }

  return success;
};

export const syncGameUserTopicsFromProfiles = async (profiles = []) => {
  if (!Array.isArray(profiles) || profiles.length === 0) return;

  const permitted = await hasNotificationPermission();
  if (!permitted) return;

  const uniqueGameNames = [
    ...new Set(
      profiles
        .map((profile) => profile?.game_name)
        .filter(Boolean),
    ),
  ];

  await Promise.all(
    uniqueGameNames.map(async (gameName) => {
      try {
        const gameKey = getGameCreationTopicKey(gameName);
        if (!gameKey) return;

        const alreadySubscribed = await AsyncStorage.getItem(getGameUserStorageKey(gameKey));
        if (alreadySubscribed === 'true') return;

        await subscribeToGameUserTopicIfPermitted(gameName);
      } catch (error) {
        if (__DEV__) console.log(`Game user topic sync error (${gameName}):`, error);
      }
    }),
  );
};

export const resyncGameUserTopicsFromStorage = async () => {
  const permitted = await hasNotificationPermission();
  if (!permitted) return;

  await Promise.all(
    Object.entries(GAME_USER_TOPICS).map(async ([gameKey, topic]) => {
      try {
        const value = await AsyncStorage.getItem(getGameUserStorageKey(gameKey));
        if (value === 'true') {
          await subscribeToTopic(topic);
        }
      } catch (error) {
        if (__DEV__) console.log(`Game user topic resync error (${topic}):`, error);
      }
    }),
  );
};

export const clearGameUserTopicSubscriptions = async () => {
  await Promise.all(
    Object.entries(GAME_USER_TOPICS).map(async ([gameKey, topic]) => {
      try {
        const value = await AsyncStorage.getItem(getGameUserStorageKey(gameKey));
        if (value === 'true') {
          await unsubscribeFromTopic(topic);
        }
        await AsyncStorage.removeItem(getGameUserStorageKey(gameKey));
      } catch (error) {
        if (__DEV__) console.log(`Game user topic cleanup error (${topic}):`, error);
      }
    }),
  );
};
