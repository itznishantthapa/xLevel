import { useInfiniteQuery } from "@tanstack/react-query";
import { ChallengeAPI } from "../api/challengeApi";

const THIRTY_SEC = 30 * 1000; 

export const useOpenChallenge = (pageSize = 10, game_id, game_mode) =>
  useInfiniteQuery({

    queryKey: ["openChallenge", pageSize, game_id, game_mode],
    initialPageParam: 0,

    queryFn: ({ pageParam = 0 }) =>
      ChallengeAPI.getOpenChallengesOnLoads({
        offset: pageParam,
        limit: pageSize,
        game_id: game_id,
        game_mode: game_mode || undefined,
      }),

    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.has_more ? allPages.length * pageSize : undefined;
    },

    staleTime: THIRTY_SEC,

    select: (data) => ({
      flat: data?.pages?.flatMap((p) => p?.challenges ?? []) ?? [],
      hasMore: data?.pages?.at(-1)?.has_more ?? false,
    }),

  });

