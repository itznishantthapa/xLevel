import { useMutation} from "@tanstack/react-query";
import { ChallengeAPI } from "../../api/challengeApi";
import { queryClient } from "../../lib/queryClient";


export const useJoinMatch = () => {

  return useMutation({
    mutationFn: (payload) => ChallengeAPI.join(payload),

    onSuccess: (data) => {
      const joinedChallenge = data?.challenge;

      // Update cached matches immediately
      queryClient.setQueryData(["myMatch", 5], (oldData) => {
        if (!oldData) return oldData;

                return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                challenges: [joinedChallenge, ...(page?.challenges ?? [])],   
              };
            }
            return page;
          }),
        };
      });
    },
  });
};
