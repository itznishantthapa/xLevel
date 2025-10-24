import { useQuery } from "@tanstack/react-query";
import { GuideAPI } from "../api/guideApi";

// One day in milliseconds
const ONE_DAY = 24 * 60 * 60 * 1000;


export const useGuides = () =>
  useQuery({
    queryKey: ["guides"],
    queryFn: GuideAPI.getGuides,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY, // Previously cacheTime in v4
    retry: false, // No automatic retries
    select: (guides) => guides ?? [],
  });
