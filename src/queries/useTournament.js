// queries/useTournament.js
// TanStack Query hook to fetch user tournaments with infinite loading

import { useInfiniteQuery } from "@tanstack/react-query";
import { TournamentAPI } from "../api/tournamentApi";
import { queryClient } from "../lib/queryClient";

const ONE_MIN = 1 * 60 * 1000;

export const useInfiniteTournaments = (pageSize = 5) => {
  const queryResult = useInfiniteQuery({
    queryKey: ["tournaments", pageSize],
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }) =>
      TournamentAPI.getTournamentsOnLoads({ offset: pageParam, limit: pageSize }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.has_more ? allPages.length * pageSize : undefined;
    },
    staleTime: ONE_MIN,
    refetchOnMount: true,
    select: (data) => ({
      flat: data?.pages?.flatMap((p) => p?.tournaments ?? []) ?? [],
      hasMore: data?.pages?.at(-1)?.has_more ?? false,
    }),
  });

  // Utility functions for tournament operations
  const invalidateTournamentsQuery = async () => {
    return queryClient.invalidateQueries({ queryKey: ["tournaments", pageSize] });
  };

  return {
    ...queryResult,
    invalidateTournamentsQuery,
  };
};