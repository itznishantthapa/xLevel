// queries/useGameProfiles.js
// TanStack Query hook to fetch game profiles

import { useQuery } from "@tanstack/react-query";
import { GameProfilesAPI } from "../api/gameProfilesApi";
import { useAuthStore } from "../store/authStore";




const FIVE_MIN = 5 * 60 * 1000;

export const useGameProfiles = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["gameProfiles", user?.id], // user-scoped key
    enabled: !!user, // don't fetch if no user
    queryFn: () => GameProfilesAPI.getAll(user.id),
    select: (profiles) => profiles ?? [],
    staleTime: FIVE_MIN,
  });
};


  