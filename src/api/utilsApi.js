// api/socialsApi.js
// API functions specific to socials

import { API } from "./client";
import { endpoints } from "./endpoints";

export const UtilsAPI = {
  getUtils: async () => {
    const res = await API.get(endpoints.getUtils);
    return res.data?.utils ?? [];
  },
};


