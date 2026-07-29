export const MAX_CAROUSEL_GAMES = 4;

/** Stable keys used for preference storage — matched to API games by name */
export const CAROUSEL_GAME_KEYS = {
  FREE_FIRE: 'free_fire',
  PUBG: 'pubg',
  EFOOTBALL: 'efootball',
  FC: 'fc',
  MLBB: 'mlbb',
};

/** Display order: Free Fire → PUBG → eFootball → FC → MLBB */
export const CAROUSEL_GAME_ORDER = [
  CAROUSEL_GAME_KEYS.FREE_FIRE,
  CAROUSEL_GAME_KEYS.PUBG,
  CAROUSEL_GAME_KEYS.EFOOTBALL,
  CAROUSEL_GAME_KEYS.FC,
  CAROUSEL_GAME_KEYS.MLBB,
];

/** Fallback for users who never saved a preference */
export const DEFAULT_CAROUSEL_GAME_IDS = [
  CAROUSEL_GAME_KEYS.FREE_FIRE,
  CAROUSEL_GAME_KEYS.PUBG,
  CAROUSEL_GAME_KEYS.EFOOTBALL,
  CAROUSEL_GAME_KEYS.MLBB,
];

/** Static preference list — no API, names only for GameSelection screen */
export const CAROUSEL_GAME_OPTIONS = [
  { game_id: 1, game_key: CAROUSEL_GAME_KEYS.FREE_FIRE, game_name: 'Free Fire' },
  { game_id: 5, game_key: CAROUSEL_GAME_KEYS.PUBG, game_name: 'PUBG Mobile' },
  { game_id: 3, game_key: CAROUSEL_GAME_KEYS.EFOOTBALL, game_name: 'eFootball' },
  { game_id: 2, game_key: CAROUSEL_GAME_KEYS.FC, game_name: 'FC Mobile' },
  { game_id: 4, game_key: CAROUSEL_GAME_KEYS.MLBB, game_name: 'MLBB' },
];

export const normalizeGameKey = (name = '') => {
  const normalized = name.toLowerCase().replace(/\s+/g, '');

  if (normalized.includes('freefire')) return CAROUSEL_GAME_KEYS.FREE_FIRE;
  if (normalized.includes('pubg')) return CAROUSEL_GAME_KEYS.PUBG;
  if (normalized.includes('efootball')) return CAROUSEL_GAME_KEYS.EFOOTBALL;
  if (normalized === 'fc' || normalized.includes('fcmobile')) return CAROUSEL_GAME_KEYS.FC;
  if (normalized.includes('mlbb')) return CAROUSEL_GAME_KEYS.MLBB;

  return normalized;
};

export const getGameKeyFromOptionId = (optionId) =>
  CAROUSEL_GAME_OPTIONS.find((option) => option.game_id === Number(optionId))?.game_key ?? null;

export const getOptionIdFromGameKey = (gameKey) =>
  CAROUSEL_GAME_OPTIONS.find((option) => option.game_key === gameKey)?.game_id ?? null;

export const resolveOptionIdsToGameKeys = (optionIds = []) =>
  optionIds.map(getGameKeyFromOptionId).filter(Boolean);
