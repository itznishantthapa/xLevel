// useGameAccounts.js
import { useInfiniteQuery } from "@tanstack/react-query";
import { BuySellAPI } from "../api/buysellApi";

const ONE_MINUTE = 60 * 1000;

export const useGameAccounts = (pageSize = 5) =>
  useInfiniteQuery({
    queryKey: ["gameAccounts", pageSize],
    initialPageParam: 0,

    queryFn: ({ pageParam = 0 }) =>
      BuySellAPI.getGameAccountsOnLoads({ offset: pageParam, limit: pageSize }),

    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.has_more ? allPages.length * pageSize : undefined;
    },

    staleTime: ONE_MINUTE,

    select: (data) => ({
      flat: data?.pages?.flatMap((p) => p?.accounts ?? []) ?? [],
      hasMore: data?.pages?.at(-1)?.has_more ?? false,
    }),
  });
