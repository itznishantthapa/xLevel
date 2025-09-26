// api/notificationsApi.js
// API functions specific to notifications

import { API } from "./client";
import { endpoints } from "./endpoints";

export const NotificationsAPI = {
  getOnLoads: async ({ offset = 0, limit = 10 } = {}) => {
    const res = await API.get(endpoints.getUserNotificationsOnLoads, {
      params: { offset, limit },
    });
    return res.data ?? { notifications: [], has_more: false };
  },
};


