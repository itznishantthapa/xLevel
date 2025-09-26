// api/gameProfilesApi.js
// API functions specific to game profiles

import { API } from "./client";
import { endpoints } from "./endpoints";

export const GameProfilesAPI = {
  getAll: async () => {
    const res = await API.get(endpoints.getGameProfiles);
    return res.data?.profiles ?? [];
  },
  save: async (payload) => {
    const res = await API.post(endpoints.saveGameProfile, payload);
    return res.data?.profile;
  },
};


