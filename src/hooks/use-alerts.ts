import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AlertItem, PaginatedResponse } from '@/types'

export function useAlerts(page = 1, pageSize = 30) {
  return useQuery({
    queryKey: ['alerts', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AlertItem>>('/alerts', {
        params: { page, pageSize },
      })
      return data
    },
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data } = await api.post(`/alerts/${alertId}/acknowledge`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
