import { useQuery } from '@tanstack/react-query'
import { api, getAccessToken } from '@/lib/api'
import type { ExecutiveSummaryReport } from '@/types'

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const { data } = await api.get<ExecutiveSummaryReport>('/analytics/summary')
      return data
    },
    enabled: typeof window !== 'undefined' && !!getAccessToken(),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  })
}
