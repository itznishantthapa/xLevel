import { useMutation } from "@tanstack/react-query";
import { BuySellAPI } from "../../api/buysellApi";

export const useDeleteGameAccount = () => {
  return useMutation({
    mutationFn: (productId) => BuySellAPI.deleteGameAccount(productId),
  });
};
