// queries/useBanners.js
// TanStack Query hook to fetch banners

import { useQuery } from "@tanstack/react-query";
import { BannerAPI } from "../api/bannerApi";

const  TEN_MIN = 10 * 60 * 1000;

export const useBanners = () =>
  useQuery({
    queryKey: ["banners"],
    queryFn: BannerAPI.getAll,
    staleTime: TEN_MIN,
    select: (banners) => banners ?? [],
  });


