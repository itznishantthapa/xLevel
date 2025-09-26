// queries/useUpcomingChallenges.js
// TanStack Query hook to fetch upcoming official challenges

import { useQuery } from "@tanstack/react-query";
import { ChallengeAPI } from "../api/challengeApi";


const TEN_MIN = 10 * 60 * 1000;

export const useUpcomingChallenges = () =>
  useQuery({
    queryKey: ["upcomingChallenges"],
    queryFn: ChallengeAPI.getUpcoming,
    // Cache remains fresh for 10 minutes; refetch happens when stale or manual refresh
    staleTime: TEN_MIN,
    refetchOnMount: true,
    select: (challenges) => challenges ?? [],
  });


