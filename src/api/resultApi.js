import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import { API } from "./client";
import { endpoints } from "./endpoints";

export const ResultAPI = {
  submitResult: async (formData) => {

      const res = await API.post(endpoints.submitResult, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data ?? {};

  },


  getResult: async (params) => {

      const res = await API.get(endpoints.getResult, {
        params: params
      });
      return res.data?.result ?? {};

  },
};