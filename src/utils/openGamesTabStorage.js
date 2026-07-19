import AsyncStorage from '@react-native-async-storage/async-storage';

const OPEN_GAMES_ACTIVE_TAB_KEY = '@open_games_active_game_id';

export const getOpenGamesActiveGameId = async () => {
  try {
    return await AsyncStorage.getItem(OPEN_GAMES_ACTIVE_TAB_KEY);
  } catch (error) {
    if (__DEV__) console.log('Failed to read OpenGames active tab:', error);
    return null;
  }
};

export const setOpenGamesActiveGameId = async (gameId) => {
  if (gameId == null) return;

  try {
    await AsyncStorage.setItem(OPEN_GAMES_ACTIVE_TAB_KEY, String(gameId));
  } catch (error) {
    if (__DEV__) console.log('Failed to save OpenGames active tab:', error);
  }
};

export const getOpenGamesTabIndex = async (routes = []) => {
  if (!routes.length) return 0;

  const savedGameId = await getOpenGamesActiveGameId();
  if (!savedGameId) return 0;

  const savedIndex = routes.findIndex(
    route => String(route.game_id) === savedGameId,
  );

  return savedIndex >= 0 ? savedIndex : 0;
};
