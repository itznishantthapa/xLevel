import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import { API } from "./client";
import { endpoints } from "./endpoints";

export const GamePointAPI = {
  getPointsIn: async (payload) => {
    const res = await API.post(endpoints.getPointsIn, payload,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return res.data;
  },

  getPointsOut: async (payload) => {
    const res = await API.post(endpoints.getPointsOut, payload,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return res.data;
  },

  getPointsHistory: async (params) => {
    const { offset = 0, limit = 10 } = params || {};
    const queryParams = new URLSearchParams();
    
    if (offset !== undefined) queryParams.append('offset', offset);
    if (limit !== undefined) queryParams.append('limit', limit);
    
    const queryString = queryParams.toString();
    const url = `${endpoints.getPointsHistory}${queryString ? '?' + queryString : ''}`;
    
    const res = await API.get(url);
    return res.data;
  },
};


 