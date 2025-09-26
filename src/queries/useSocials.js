// queries/useSocials.js
// TanStack Query hook to fetch socials list

import { useQuery } from "@tanstack/react-query";
import { SocialsAPI } from "../api/socialsApi";

const ONE_DAY = 24 * 60 * 60 * 1000;

export const useSocials = () =>
  useQuery({
    queryKey: ["socials"],
    queryFn: SocialsAPI.getAll,
    staleTime: ONE_DAY,
    select: (socials) => socials ?? [],
  });


