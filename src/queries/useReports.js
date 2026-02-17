import { useInfiniteQuery } from "@tanstack/react-query";
import { ReportAPI } from "../api/reportApi";

const THIRTY_SEC = 30 * 1000;

export const useReports = (pageSize = 10) =>
  useInfiniteQuery({
    queryKey: ["reports", pageSize],
    initialPageParam: 0,

    queryFn: ({ pageParam = 0 }) =>
      ReportAPI.getReports({ offset: pageParam, limit: pageSize }),

    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.has_more ? allPages.length * pageSize : undefined;
    },

    staleTime: THIRTY_SEC,

    select: (data) => ({
      flat: data?.pages?.flatMap((p) => p?.reports ?? []) ?? [],
      hasMore: data?.pages?.at(-1)?.has_more ?? false,
    }),
  });
