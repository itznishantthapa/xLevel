import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../lib/queryClient";
import { BuySellAPI } from "../../api/buysellApi";

export const usePurchaseGameAccount = () => {
  return useMutation({
    mutationFn: (accountId) => BuySellAPI.purchaseGameAccount(accountId),

    onSuccess: (data) => {
      const orderData = data?.pointsinout;

      if (!orderData || !orderData.id) {
        return;
      }

      // Update cached points history immediately
      queryClient.setQueryData(["points", 8], (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) {
              const existingIds = new Set((page?.pointsinout ?? []).map(item => item?.id));

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
