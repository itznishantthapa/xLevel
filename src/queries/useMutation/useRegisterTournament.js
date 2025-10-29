import { useMutation} from "@tanstack/react-query";
import { ChallengeAPI } from "../../api/challengeApi";
import { queryClient } from "../../lib/queryClient";


export const useRegisterTournament = () => {
  return useMutation({
    mutationFn: (payload) => ChallengeAPI.join(payload),

    onSuccess: (data) => {
      const joinedChallenge = data?.challenge;

      if (!joinedChallenge) {
        if (__DEV__) {
          console.warn("registerTournament: response missing challenge payload", data);
        }
        return;
      }

      // Update cached tournaments immediately
      queryClient.setQueryData(["tournaments", 5], (oldData) => {

        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                tournaments: [joinedChallenge, ...(page?.tournaments ?? [])],    //<---- SEE BELOW FOR MORE
              };
            }
            return page;
          }),
        };
      });
    },
  });
};


// =========== IMPORTANT ===========================

// Look at the query that loads the data initially
// const useMyMatches = () => {
//   return useInfiniteQuery({
//     queryKey: ["myMatch", 5],
//     queryFn: ({ pageParam = 0 }) => 
//       MatchAPI.getMatches({ offset: pageParam, limit: 5 })
//     // ...

//   })
// }


// If it returns { tournaments: [...], has_more: true }, then you need to update tournaments. ->  tournaments: [joinedChallenge, ...(page?.tournaments ?? [])], 
// If it returns { challenges: [...], has_more: true }, then you need to update challenges. ->  challenges: [joinedChallenge, ...(oldData.pages[0]?.challenges ?? [])],