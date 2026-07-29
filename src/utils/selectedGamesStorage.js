import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CAROUSEL_GAME_ORDER,
  DEFAULT_CAROUSEL_GAME_IDS,
  MAX_CAROUSEL_GAMES,
  getOptionIdFromGameKey,
  normalizeGameKey,
  resolveOptionIdsToGameKeys,
} from '../constants/games';

export const SELECTED_CAROUSEL_GAMES_KEY = '@selected_carousel_games';

const normalizeStoredSelection = (parsed) => {
  if (!Array.isArray(parsed) || parsed.length !== MAX_CAROUSEL_GAMES) {
    return null;
  }

  const asKeys = parsed.every((item) => typeof item === 'string')
    ? parsed
    : resolveOptionIdsToGameKeys(parsed.map(Number));

  return asKeys.length === MAX_CAROUSEL_GAMES ? asKeys : null;
};

export const getSelectedGameKeys = async () => {
  try {
    const raw = await AsyncStorage.getItem(SELECTED_CAROUSEL_GAMES_KEY);
    if (!raw) return null;

    return normalizeStoredSelection(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const getSelectedGameIds = async () => {
  const keys = await getSelectedGameKeys();
  if (!keys) return null;

  const optionIds = keys.map(getOptionIdFromGameKey).filter(Boolean);
  return optionIds.length === MAX_CAROUSEL_GAMES ? optionIds : null;
};

export const hasSelectedCarouselGames = async () => {
  const keys = await getSelectedGameKeys();
  return Array.isArray(keys) && keys.length === MAX_CAROUSEL_GAMES;
};

export const saveSelectedGameIds = async (optionIds) => {
  const keys = resolveOptionIdsToGameKeys(optionIds.map(Number)).slice(0, MAX_CAROUSEL_GAMES);
  await AsyncStorage.setItem(SELECTED_CAROUSEL_GAMES_KEY, JSON.stringify(keys));
  return keys;
};

export const clearSelectedCarouselGames = async () => {
  await AsyncStorage.removeItem(SELECTED_CAROUSEL_GAMES_KEY);
};

const findApiGameByKey = (apiGames, gameKey) =>
  apiGames.find((game) => normalizeGameKey(game.game_name) === gameKey);

export const resolveCarouselGames = (selectedKeys, apiGames = []) => {
  if (!apiGames.length || !selectedKeys?.length) return [];

  const keySet = new Set(selectedKeys);

  return CAROUSEL_GAME_ORDER
    .filter((key) => keySet.has(key))
    .map((key) => findApiGameByKey(apiGames, key))
    .filter(Boolean);
};

export const getVisibleCarouselGames = async (apiGames = []) => {
  if (!apiGames.length) return [];

  const keys = await getSelectedGameKeys();

  return resolveCarouselGames(keys ?? DEFAULT_CAROUSEL_GAME_IDS, apiGames);
};
