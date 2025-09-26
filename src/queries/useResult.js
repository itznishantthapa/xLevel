


import { useQuery } from "@tanstack/react-query";
import { ResultAPI } from "../api/resultApi";


const ZERO = 0;

export const useResult = (challenge_id) =>
  useQuery({
    queryKey: ["results", challenge_id],
    queryFn: () => ResultAPI.getResult({challenge_id: challenge_id}),
    staleTime: ZERO,
    refetchOnMount: true,
    select: (result) => result ?? [],
    enabled: !!challenge_id,  //strictly check if challenge_id is not null or undefined or empty or '' or 0
  });
