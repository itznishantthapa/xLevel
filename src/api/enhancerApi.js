import { API } from "./client";
import { endpoints } from "./endpoints";

export const EnhancerAPI = {
  getEnhancements: async () => {
    try {
      const res = await API.get(endpoints.getEnhancements);
      // Ensure we always return an array
      const enhancers = res.data?.enhancers ?? [];
      return Array.isArray(enhancers) ? enhancers : [];
    } catch (error) {
       if(__DEV__){
         console.error('Failed to fetch enhancements:', error);
       }
      throw error;
    }
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


