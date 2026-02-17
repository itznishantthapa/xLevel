import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../lib/queryClient";
import { ReportAPI } from "../../api/reportApi";

export const useCreateReport = () => {
  return useMutation({
    mutationFn: (payload) => ReportAPI.submitReport(payload),

    onSuccess: (data) => {
      const createdReport = data?.report;
      // Update cached reports immediately
      queryClient.setQueryData(["reports", 10], (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                reports: [createdReport, ...(page?.reports ?? [])],
              };
            }
            return page;
          }),
        };
      });
    },
  });
};
