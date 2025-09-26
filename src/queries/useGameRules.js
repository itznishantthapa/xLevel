// queries/useGameProfiles.js
// TanStack Query hook to fetch game profiles

import { useQuery } from "@tanstack/react-query";
import { GameRulesAPI } from "../api/gameRulesApi";

const ONE_DAY = 24 * 60 * 60 * 1000;

export const useGameRules = () =>
  useQuery({
    queryKey: ["gameRules"],
    queryFn: GameRulesAPI.getAll,
    staleTime: ONE_DAY,
    refetchOnMount: true,
    select: (rules) => rules ?? [],
  });


