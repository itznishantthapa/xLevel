import { useMutation } from "@tanstack/react-query";
import { GameProfilesAPI } from "../../api/gameProfilesApi";
import { queryClient } from "../../lib/queryClient";
import { useAuthStore } from "../../store/authStore";


export const useEditGameProfile = () => {
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (payload) => GameProfilesAPI.save(payload),

    onSuccess: (updatedProfile) => {
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
    },
  });
};
