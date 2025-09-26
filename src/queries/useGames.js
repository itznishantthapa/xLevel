// queries/useGames.js
// TanStack Query hook to fetch games list

import { useQuery } from "@tanstack/react-query";
import { GamesAPI } from "../api/gamesApi";

const FIVE_MIN = 5 * 60 * 1000;

export const useGames = () =>
  useQuery({
    queryKey: ["games"],
    queryFn: GamesAPI.getAll,
    staleTime: FIVE_MIN,
    select: (games) => games ?? [],
  });


