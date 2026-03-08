// api/buysellApi.js
// API functions specific to buy/sell game accounts

import { API } from "./client";
import { endpoints } from "./endpoints";

export const BuySellAPI = {
  getGameAccountsOnLoads: async ({ offset = 0, limit = 5 } = {}) => {
    const res = await API.get(endpoints.getGameAccountsOnLoads, {
      params: { offset, limit },
    });
    return res.data ?? { accounts: [], has_more: false };
  },

  createGameAccount: async (formData) => {
    const res = await API.post(endpoints.createGameAccount, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  deleteGameAccount: async (productId) => {
    const res = await API.delete(endpoints.deleteGameAccount, {
      params: { product_id: productId },
    });
    return res.data;
  },

  purchaseGameAccount: async (accountId) => {
    const res = await API.post(endpoints.purchaseGameAccount, {
      account_id: accountId,
    });
    return res.data;
  },
};
