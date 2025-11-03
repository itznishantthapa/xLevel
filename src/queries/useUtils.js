// queries/useUtils.js
// TanStack Query hook to fetch utils list

import { useQuery } from "@tanstack/react-query";
import { UtilsAPI } from "../api/utilsApi";

const ONE_DAY = 24 * 60 * 60 * 1000;

export const useUtils = () =>
  useQuery({
    queryKey: ["utils"],
    queryFn: UtilsAPI.getUtils,
    staleTime: ONE_DAY,
    select: (utils) => utils ?? [],
  });


