// api/socialsApi.js
// API functions specific to socials

import { API } from "./client";
import { endpoints } from "./endpoints";

export const SocialsAPI = {
  getAll: async () => {
    const res = await API.get(endpoints.getSocials);
    return res.data?.socials ?? [];
  },
};


