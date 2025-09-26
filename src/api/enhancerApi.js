import { API } from "./client";
import { endpoints } from "./endpoints";

export const EnhancerAPI = {
  getEnhancements: async () => {
    const res = await API.get(endpoints.getEnhancements);
    return res.data?.enhancers ?? [];
  },

  exchangeEnhancements: async (payload) => {
    const res = await API.post(endpoints.exchangeEnhancements, payload);
    return res;
  },

  updateTagStatus: async (payload) => {
    const res = await API.post(endpoints.updateTagStatus, payload);
    return res;
  }
};


