// queries/useLeaderboard.js
import { useQuery } from "@tanstack/react-query";
import { LeaderboardAPI } from "../api/leaderboardApi";

const FIVE_MINUTES = 5 * 60 * 1000;

export const useLeaderboard = () =>
  useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => LeaderboardAPI.getLeaderboard(),
    staleTime: FIVE_MINUTES,
    select: (data) => data ?? { leaderboard_users: [], user_rank: null },
  });