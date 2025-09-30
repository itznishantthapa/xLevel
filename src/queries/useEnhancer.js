import { useQuery } from "@tanstack/react-query";
import { EnhancerAPI } from "../api/enhancerApi";
 

 
const TEN_MIN = 10 * 60 * 1000; // 10 minutes in milliseconds

export const useEnhancements = () =>
  useQuery({
    queryKey: ["enhancements"],
    queryFn: EnhancerAPI.getEnhancements,
    staleTime: TEN_MIN,
    gcTime: TEN_MIN, // Previously cacheTime in v4
    retry: false, // No automatic retries
    select: (enhancers) => enhancers ?? [],
  });


