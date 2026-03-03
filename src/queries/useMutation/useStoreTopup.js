import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../lib/queryClient";
import { StoreAPI } from "../../api/storeApi";


export const useStoreTopup = () => {
  return useMutation({
    mutationFn: (payload) => StoreAPI.placeTopup(payload),

    onSuccess: (data) => {
      const orderData = data?.order;

      // Only update cache if we have valid order data
      if (!orderData || !orderData.id) {
        return;
      }

      // Update cached points immediately
      queryClient.setQueryData(["points", 8], (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) {
              const existingIds = new Set((page?.pointsinout ?? []).map(item => item?.id));
              
              // Only add if it doesn't already exist
              if (!existingIds.has(orderData.id)) {
                return {
                  ...page,
                  pointsinout: [orderData, ...(page?.pointsinout ?? [])],
                };
              }
              return page;
            }
            return page;
          }),
        };
      });
    },
  });
};
