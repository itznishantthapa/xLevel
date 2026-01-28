import { useMutation} from "@tanstack/react-query";
import { ChallengeAPI } from "../../api/challengeApi";
import { queryClient } from "../../lib/queryClient";
import { GamePointAPI } from "../../api/pointsApi";


export const usePointsIn = () => {


  return useMutation({
    mutationFn: (payload) => GamePointAPI.getPointsIn(payload),

    onSuccess: (data) => {
      const pointsInData = data?.pointsin;

      // Update cached matches immediately
      queryClient.setQueryData(["points", 8], (oldData) => {
        if (!oldData) return oldData;

                return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                pointsinout: [pointsInData, ...(page?.pointsinout ?? [])],
              };
            }
            return page;
          }),
        };
      });
    },
  });
};
