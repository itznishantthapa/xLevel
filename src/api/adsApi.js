// api/adsApi.js
// API functions specific to ads and wallet updates

import { API } from "./client";
import { endpoints } from "./endpoints";


export const AdsAPI = {
  // Update wallet balance after watching ads
  updateGamePoints: async (payload) => {
    const res = await API.post(endpoints.updateGamePoints, payload);
    return res.data;
  },
}