import { API } from "./client";
import { endpoints } from "./endpoints";

export const blockUser = async (payload) => {
    const res = await API.post(endpoints.blockUser, payload);
    return res.data;
};


export const getBlockedUsers = async () => {
    const res = await API.get(endpoints.getBlockedUsers);
    return res.data;
};


 export const unblockUser = async (payload) => {
    const res = await API.post(endpoints.unblockUser, payload);
    return res.data;
}

