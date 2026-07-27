import { useMutation } from "@tanstack/react-query";
import { GameProfilesAPI } from "../../api/gameProfilesApi";
import { queryClient } from "../../lib/queryClient";
import { useAuthStore } from "../../store/authStore";
import { subscribeToGameUserTopicIfPermitted } from "../../utils/gameUserTopicStorage";


export const useEditGameProfile = () => {
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (payload) => GameProfilesAPI.save(payload),

    onSuccess: async (updatedProfile, variables) => {
      if (!user?.id) return;

      queryClient.setQueryData(["gameProfiles", user.id], (oldData) => {
        if (!oldData) return [updatedProfile];

        const idx = oldData.findIndex((p) => p.game_id === updatedProfile.game_id);
        if (idx >= 0) {
          const newArr = [...oldData];
          newArr[idx] = updatedProfile;
          return newArr;
        }
        return [...oldData, updatedProfile];
      });

      try {
        await subscribeToGameUserTopicIfPermitted(
          updatedProfile?.game_name || variables?.game_name,
        );
      } catch (error) {
        if (__DEV__) console.log('Game user topic subscription error:', error);
      }
    },
  });
};
