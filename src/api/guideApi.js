import { API } from "./client";
import { endpoints } from "./endpoints";

export const GuideAPI = {
  getGuides: async () => {
    try {
      const res = await API.get(endpoints.getGuides);
      // Ensure we always return an array
      const guides = res.data?.guides ?? [];
      return Array.isArray(guides) ? guides : [];
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch guides:', error);
      }
      throw error;
    }
  },
};
