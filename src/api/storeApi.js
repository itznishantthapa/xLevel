// api/storeApi.js
// API functions for game store items

import { API } from "./client";
import { endpoints } from "./endpoints";

export const StoreAPI = {
  /**
   * Fetch store items for a specific game
   * @param {string} game - Game identifier (e.g., 'freefire', 'pubg', 'mlbb')
   * @returns {Promise} - Promise resolving to store items data
   */
  getStoreItems: async (game) => {
    const res = await API.get(endpoints.getStoreItems, {
      params: { game },
    });
    return res.data;
  },

  /**
   * Place a top-up request
   * @param {Object} payload - Top-up request data
   * @returns {Promise}
   */
  placeTopup: async (payload) => {
    const res = await API.post(endpoints.placeTopup, payload);
    return res.data;
  },
};
