// api/reportApi.js
// API functions specific to match reports

import { API } from "./client";
import { endpoints } from "./endpoints";

export const ReportAPI = {
  submitReport: async (formData) => {
    const res = await API.post(endpoints.submitReport, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data ?? {};
  },

  checkPlayerDeviceActivity: async ({ challenge_id }) => {
    const res = await API.post(endpoints.checkPlayerDeviceActivity, { challenge_id });
    return res.data ?? {};
  },

  getReports: async (params) => {
    const { offset = 0, limit = 10 } = params || {};
    const queryParams = new URLSearchParams();

    if (offset !== undefined) queryParams.append('offset', offset);
    if (limit !== undefined) queryParams.append('limit', limit);

    const queryString = queryParams.toString();
    const url = `${endpoints.getReports}${queryString ? '?' + queryString : ''}`;

    try {
      const res = await API.get(url);
      return {
        reports: Array.isArray(res.data?.reports) ? res.data.reports : [],
        has_more: res.data?.has_more ?? false,
      };
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching reports:', error);
      }
      return {
        reports: [],
        has_more: false,
      };
    }
  },
};
