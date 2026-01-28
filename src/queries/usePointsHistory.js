

import { useInfiniteQuery } from "@tanstack/react-query";
import { GamePointAPI } from "../api/pointsApi";

const THIRTY_SEC = 30 * 1000;

export const usePointsHistory = (pageSize = 8) =>
  useInfiniteQuery({
    queryKey: ["points", pageSize],
    initialPageParam: 0,

    queryFn: ({ pageParam = 0 }) =>
      GamePointAPI.getPointsHistory({ offset: pageParam, limit: pageSize }),

    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.has_more ? allPages.length * pageSize : undefined;
    },

    staleTime: THIRTY_SEC,

    select: (data) => ({
      flat: data?.pages?.flatMap((p) => p?.pointsinout ?? []) ?? [],
      hasMore: data?.pages?.at(-1)?.has_more ?? false,
    }),
  });
