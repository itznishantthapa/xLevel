// api/tournamentApi.js
// API functions specific to tournaments

import { API } from "./client";
import { endpoints } from "./endpoints";

export const TournamentAPI = {

  getTournamentsOnLoads: async ({ offset = 0, limit = 5 } = {}) => {
    const res = await API.get(endpoints.getTournamentsOnLoads, {
      params: { offset, limit },
    });
    return res.data ?? { tournaments: [], has_more: false };
  },
};


