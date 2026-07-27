// queries/useGameProfiles.js
// TanStack Query hook to fetch game profiles

import { useQuery } from "@tanstack/react-query";
import { GameProfilesAPI } from "../api/gameProfilesApi";
import { useAuthStore } from "../store/authStore";
import { syncGameUserTopicsFromProfiles } from "../utils/gameUserTopicStorage";

const FIVE_MIN = 5 * 60 * 1000;

export const useGameProfiles = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["gameProfiles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const profiles = await GameProfilesAPI.getAll();
      const list = profiles ?? [];

      syncGameUserTopicsFromProfiles(list).catch((error) => {
        if (__DEV__) console.log('Game user topic profile sync error:', error);
      });

      return list;
    },
    select: (profiles) => profiles ?? [],
    staleTime: FIVE_MIN,
  });
};