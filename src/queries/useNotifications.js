// queries/useNotifications.js
import { useInfiniteQuery } from "@tanstack/react-query";
import { NotificationsAPI } from "../api/notificationsApi";

export const useInfiniteNotifications = (pageSize = 10) =>
  useInfiniteQuery({
    queryKey: ["notifications", pageSize],
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }) =>
      NotificationsAPI.getOnLoads({ offset: pageParam, limit: pageSize }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.has_more ? allPages.length * pageSize : undefined,
    staleTime: 30000,
  });
