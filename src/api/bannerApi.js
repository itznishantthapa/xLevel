// api/bannerApi.js
// API functions specific to banners

import { API } from "./client";
import { endpoints } from "./endpoints";

export const BannerAPI = {
  getAll: async () => {
    const res = await API.get(endpoints.getBanners);
    return res.data?.banners ?? [];
  },
};


