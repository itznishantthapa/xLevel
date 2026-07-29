import AsyncStorage from '@react-native-async-storage/async-storage';
import { CAROUSEL_GAME_ORDER, DEFAULT_CAROUSEL_GAME_IDS, MAX_CAROUSEL_GAMES } from '../constants/games';

export const SELECTED_CAROUSEL_GAMES_KEY = '@selected_carousel_games';

export const getSelectedGameIds = async () => {
  try {
    const raw = await AsyncStorage.getItem(SELECTED_CAROUSEL_GAMES_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== MAX_CAROUSEL_GAMES) {
      return null;
    }

    return parsed.map(Number);
  } catch {
    return null;
  }
};

export const hasSelectedCarouselGames = async () => {
  const ids = await getSelectedGameIds();
  return Array.isArray(ids) && ids.length === MAX_CAROUSEL_GAMES;
};

export const saveSelectedGameIds = async (gameIds) => {
  const normalized = gameIds.map(Number).slice(0, MAX_CAROUSEL_GAMES);
  await AsyncStorage.setItem(SELECTED_CAROUSEL_GAMES_KEY, JSON.stringify(normalized));
  return normalized;
};

export const clearSelectedCarouselGames = async () => {
  await AsyncStorage.removeItem(SELECTED_CAROUSEL_GAMES_KEY);
};

export const resolveCarouselGames = (gameIds, apiGames = []) => {
  if (!apiGames.length || !gameIds?.length) return [];

  const idSet = new Set(gameIds);

  return CAROUSEL_GAME_ORDER
    .filter((id) => idSet.has(id))
    .map((id) => apiGames.find((game) => game.game_id === id))
    .filter(Boolean);
};

export const getVisibleCarouselGames = async (apiGames = []) => {
  if (!apiGames.length) return [];

  const ids = await getSelectedGameIds();

  return ids
    ? resolveCarouselGames(ids, apiGames)
    : resolveCarouselGames(DEFAULT_CAROUSEL_GAME_IDS, apiGames);
};
