// queries/useTransaction.js
// TanStack Query hook to fetch transaction history with pagination

import { useInfiniteQuery } from "@tanstack/react-query";
import { TranscationAPI } from "../api/transcationApi";

const THIRTY_SEC = 30 * 1000;

export const useTransactions = (pageSize = 8) =>
  useInfiniteQuery({
    queryKey: ["transactions", pageSize],
    initialPageParam: 0,

    queryFn: ({ pageParam = 0 }) =>
      TranscationAPI.getTransactions({ offset: pageParam, limit: pageSize }),

    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.has_more ? allPages.length * pageSize : undefined;
    },

    staleTime: THIRTY_SEC,

    select: (data) => ({
      flat: data?.pages?.flatMap((p) => p?.transactions ?? []) ?? [],
      hasMore: data?.pages?.at(-1)?.has_more ?? false,
    }),
  });
