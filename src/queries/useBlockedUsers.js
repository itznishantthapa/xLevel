import { useQuery } from '@tanstack/react-query'
import { getBlockedUsers } from '../api/blockApi'

export const useBlockedUsers = () => {
  return useQuery({
    queryKey: ['blockedUsers'],
    queryFn: getBlockedUsers,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
    refetchOnMount: true,
  })
}