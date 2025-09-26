// api/gamesApi.js
// API functions specific to games

import { API } from "./client";
import { endpoints } from "./endpoints";

export const GamesAPI = {
  getAll: async () => {
    const res = await API.get(endpoints.games);
    return res.data?.games ?? [];
  },
};


