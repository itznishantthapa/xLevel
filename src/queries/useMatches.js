//useMatches.js
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChallengeAPI } from "../api/challengeApi";

const THIRTY_SEC = 30 * 1000;

export const useMyMatch = (pageSize = 5) =>
  useInfiniteQuery({
  

    queryKey: ["myMatch", pageSize],
    initialPageParam: 0,

    queryFn: ({ pageParam = 0 }) => ChallengeAPI.getMatchesOnLoads({ offset: pageParam, limit: pageSize }),

    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.has_more ? allPages.length * pageSize : undefined;
    },

    staleTime: THIRTY_SEC,

    select: (data) => ({
      flat: data?.pages?.flatMap((p) => p?.challenges ?? []) ?? [],
      hasMore: data?.pages?.at(-1)?.has_more ?? false,
    }),

  });

