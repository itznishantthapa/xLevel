import { useMutation } from "@tanstack/react-query";
import { BuySellAPI } from "../../api/buysellApi";
import { queryClient } from "../../lib/queryClient";

export const useCreateGameAccount = () => {
  return useMutation({
    mutationFn: (formData) => BuySellAPI.createGameAccount(formData),

    onSuccess: (data) => {
      const newAccount = data?.account;
      if (!newAccount) return;

      // Prepend to cached game accounts
      queryClient.setQueryData(["gameAccounts", 5], (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                accounts: [newAccount, ...(page?.accounts ?? [])],
              };
            }
            return page;
          }),
        };
      });
    },
  });
};
