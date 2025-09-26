// api/challengeApi.js
// API functions specific to challenges

import { API } from "./client";
import { endpoints } from "./endpoints";


export const ChallengeAPI = {
  getUpcoming: async () => {
    const res = await API.get(endpoints.getUpcomingGames);
    return res.data?.challenges ?? [];
  },

  create: async (payload) => {
    const res = await API.post(endpoints.createChallenge, payload);
    return res.data;
  },


  join: async (payload) => {
    const res = await API.post(endpoints.joinChallenge, payload);
    return res.data;
  },



  updateOnChallenge: async (payload) => {
    const res = await API.post(endpoints.updateOnChallenge, payload);
    return res.status;
  },

  deleteChallenge: async (payload) => {
    const res = await API.post(endpoints.deleteChallenge, payload);
    return res.data;
  },

  leaveChallenge: async (payload) => {
    const res = await API.post(endpoints.leaveChallenge, payload);
    return res.data;
  },


  //=================================================================================
  getMatchesOnLoads: async ({ offset = 0, limit = 5 } = {}) => {
    const res = await API.get(endpoints.getMatchesOnLoads, {
      params: { offset, limit },
    });
    return res.data ?? { challenges: [], has_more: false };
  },

  // api/challengeApi.js
  getOpenChallengesOnLoads: async ({ offset = 0, limit = 10, game_id, game_mode } = {}) => {
    const res = await API.get(endpoints.getOpenChallengesOnLoads, {
      params: { offset, limit, game_id, game_mode },
    });
    return res.data ?? { challenges: [], has_more: false };
  },


  confirmOpponent: async (payload) => {
    const res = await API.post(endpoints.confirmOpponent, payload);
    return res.data ?? null;
  },
};


