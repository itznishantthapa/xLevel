// queries/useStoreItems.js
// TanStack Query hook to fetch game store items

import { useQuery } from "@tanstack/react-query";
import { StoreAPI } from "../api/storeApi";

const FIVE_MIN = 5 * 60 * 1000;

/**
 * Hook to fetch store items for a specific game
 * @param {string} game - Game identifier (e.g., 'freefire', 'pubg', 'mlbb')
 * @param {boolean} enabled - Whether the query should be enabled
 */
export const useStoreItems = (game, enabled = true) => {
  return useQuery({
    queryKey: ["storeItems", game],
    queryFn: () => StoreAPI.getStoreItems(game),
    enabled: enabled && !!game,
    staleTime: FIVE_MIN,
    select: (data) => data?.items ?? [],
  });
};
