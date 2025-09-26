
import { API } from "./client";
import { endpoints } from "./endpoints";

export const IssueAPI = {
  createIssue: async (formData) => {

      const res = await API.post(endpoints.createIssue, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data ?? {};

  },

  getIssues: async (params) => {
    const { offset = 0, limit = 10 } = params || { };
    const queryParams = new URLSearchParams();
    
    if (offset !== undefined) queryParams.append('offset', offset);
    if (limit !== undefined) queryParams.append('limit', limit);
    
    const queryString = queryParams.toString();
    const url = `${endpoints.getIssues}${queryString ? '?' + queryString : ''}`;

    const res = await API.get(url);
    return res.data;
  },


};