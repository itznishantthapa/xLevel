// queries/useUtils.js
// TanStack Query hook to fetch utils list

import { useQuery } from "@tanstack/react-query";
import { UtilsAPI } from "../api/utilsApi";

const FIVE_MIN = 5 * 60 * 1000;

export const useUtils = () =>
  useQuery({
    queryKey: ["utils"],
    queryFn: UtilsAPI.getUtils,
    staleTime: FIVE_MIN,
    select: (utils) => utils ?? [],
  });


