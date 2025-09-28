import { useQuery } from "@tanstack/react-query";
import { EnhancerAPI } from "../api/enhancerApi";
 

 
const TEN_MIN = 10 * 60 * 1000; // 10 minutes in milliseconds
export const useEnhancements = () =>
  useQuery({
    queryKey: ["enhancements"],
    queryFn: EnhancerAPI.getEnhancements,
    staleTime: TEN_MIN,
    select: (enhancers) => enhancers ?? [],
  });


