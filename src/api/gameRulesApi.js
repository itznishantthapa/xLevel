// api/gameRulesApi.js
// API functions specific to game rules

import { API } from "./client";
import { endpoints } from "./endpoints";

export const GameRulesAPI = {
  getAll: async () => {
    const res = await API.get(endpoints.getGameRules);
    return res.data ?? [];
  },

};


