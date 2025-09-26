import { useQuery } from "@tanstack/react-query";
import { EnhancerAPI } from "../api/enhancerApi";
 

 

export const useEnhancements = () =>
  useQuery({
    queryKey: ["enhancements"],
    queryFn: EnhancerAPI.getEnhancements,
    refetchOnMount: true,
    select: (enhancers) => enhancers ?? [],
  });


