import { useQuery } from "@tanstack/react-query";
import { GuideAPI } from "../api/guideApi";

// One week in milliseconds
// const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
const ONE_SECOND = 1000;

export const useGuides = () =>
  useQuery({
    queryKey: ["guides"],
    queryFn: GuideAPI.getGuides,
    staleTime: ONE_SECOND,
    gcTime: ONE_SECOND, // Previously cacheTime in v4
    retry: false, // No automatic retries
    select: (guides) => guides ?? [],
  });
