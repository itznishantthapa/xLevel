export const MAX_CAROUSEL_GAMES = 4;

/** Display order: Free Fire → PUBG → eFootball → FC → MLBB */
export const CAROUSEL_GAME_ORDER = [1, 5, 3, 2, 4];

/** Fallback for users who never saved a preference */
export const DEFAULT_CAROUSEL_GAME_IDS = [1, 5, 3, 4];

/** Static preference list — no API, names only for GameSelection screen */
export const CAROUSEL_GAME_OPTIONS = [
  { game_id: 1, game_name: 'Free Fire' },
  { game_id: 5, game_name: 'PUBG Mobile' },
  { game_id: 3, game_name: 'eFootball' },
  { game_id: 2, game_name: 'FC Mobile' },
  { game_id: 4, game_name: 'MLBB' },
];
