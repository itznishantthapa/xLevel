import { useMutation} from "@tanstack/react-query";
import { ChallengeAPI } from "../../api/challengeApi";
import { queryClient } from "../../lib/queryClient";
import { TranscationAPI } from "../../api/transcationApi";


export const useCredit = () => {


  return useMutation({
    mutationFn: (payload) => TranscationAPI.credit(payload),

    onSuccess: (data) => {
      const creditTransaction = data.transaction;

      // Update cached matches immediately
      queryClient.setQueryData(["transactions", 8], (oldData) => {
        if (!oldData) return oldData;

                return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                transactions: [creditTransaction, ...(page?.transactions ?? [])],
              };
            }
            return page;
          }),
        };
      });
    },
  });
};
