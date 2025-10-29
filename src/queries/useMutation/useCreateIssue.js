import { useMutation} from "@tanstack/react-query";
import { queryClient } from "../../lib/queryClient";
import { IssueAPI } from "../../api/issueApi";


export const useCreateIssue = () => {


  return useMutation({
    mutationFn: (payload) => IssueAPI.createIssue(payload),

    onSuccess: (data) => {
      const createdIssue = data?.issue;
      // Update cached matches immediately
      queryClient.setQueryData(["issues", 10], (oldData) => {
        if (!oldData) return oldData;

                return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                issues: [createdIssue, ...(page?.issues ?? [])],
              };
            }
            return page;
          }),
        };
      });
    },
  });
};
