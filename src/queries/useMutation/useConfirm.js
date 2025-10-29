import { useMutation } from "@tanstack/react-query";
import { ChallengeAPI } from "../../api/challengeApi";
import { queryClient } from "../../lib/queryClient";

//====== most efficient way to mutate data =================
export const useConfirm = () => {

    return useMutation({
        mutationFn: (payload) => ChallengeAPI.confirmOpponent(payload),

        onSuccess: (data) => {
            const confirmedChallenge = data?.challenge;

            // Update cached matches immediately
            queryClient.setQueryData(["myMatch", 5], (oldData) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page, index) =>
                        index === 0
                            ? {
                                ...page,
                                challenges: [
                                    // replace if id: exists, otherwise prepend
                                    confirmedChallenge,
                                    ...(page.challenges ?? []).filter(
                                        (c) => c.id !== confirmedChallenge.id
                                    ),
                                ],
                            }
                            : page
                    ),
                };
            });

        },
    });
};
