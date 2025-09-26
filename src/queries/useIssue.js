

import { useInfiniteQuery } from "@tanstack/react-query";
import { IssueAPI } from "../api/issueApi";

const THIRTY_SEC = 30 * 1000;

export const useIssues = (pageSize = 10) =>
  useInfiniteQuery({
    queryKey: ["issues", pageSize],
    initialPageParam: 0,

    queryFn: ({ pageParam = 0 }) =>
      IssueAPI.getIssues({ offset: pageParam, limit: pageSize }),

    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.has_more ? allPages.length * pageSize : undefined;
    },

    staleTime: THIRTY_SEC,

    select: (data) => ({
      flat: data?.pages?.flatMap((p) => p?.issues ?? []) ?? [],
      hasMore: data?.pages?.at(-1)?.has_more ?? false,
    }),
  });
