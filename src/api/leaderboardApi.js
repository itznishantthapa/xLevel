// api/leaderboardApi.js
// API functions specific to leaderboard

import { API } from "./client";
import { endpoints } from "./endpoints";

export const LeaderboardAPI = {
  getLeaderboard: async () => {
    const res = await API.get(endpoints.getLeaderboard);
    return res.data ?? { leaderboard_users: [], user_rank: null };
  },
};


