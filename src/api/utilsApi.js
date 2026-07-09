// api/utilsApi.js
// API functions for app utilities

import { API } from "./client";
import { endpoints } from "./endpoints";

export const UtilsAPI = {
  getUtils: async () => {
    const res = await API.get(endpoints.getUtils);
    return res.data?.utils ?? [];
  },
};


