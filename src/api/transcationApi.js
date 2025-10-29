import { API } from "./client";
import { endpoints } from "./endpoints";

export const TranscationAPI = {
  credit: async (payload) => {
    const res = await API.post(endpoints.transcationCredit, payload,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return res.data;
  },

  withdraw: async (payload) => {
    const res = await API.post(endpoints.transcationWithdraw, payload,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return res.data;
  },

  getTransactions: async (params) => {
    const { offset = 0, limit = 10 } = params || {};
    const queryParams = new URLSearchParams();
    
    if (offset !== undefined) queryParams.append('offset', offset);
    if (limit !== undefined) queryParams.append('limit', limit);
    
    const queryString = queryParams.toString();
    const url = `${endpoints.getTransactions}${queryString ? '?' + queryString : ''}`;
    
    const res = await API.get(url);
    return res.data;
  },
};


// return Response({
//     "message": _("Credit transaction created successfully"),
//     "success": True,
//     "transaction_id": transaction_obj.id,
//     "status": transaction_obj.status,
//     "amount": transaction_obj.amount,
//     "type": transaction_obj.type,
// }, status=status.HTTP_201_CREATED)