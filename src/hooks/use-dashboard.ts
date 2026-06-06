import { useQuery } from '@tanstack/react-query'
import { api, getAccessToken } from '@/lib/api'
import type { ExecutiveSummary, OrderSummary, PaginatedResponse } from '@/types'

export function useExecutiveSummary() {
  return useQuery({
    queryKey: ['executive-summary'],
    queryFn: async () => {
      const { data } = await api.get<ExecutiveSummary>('/dashboard/summary')
      return data
    },
    enabled: typeof window !== 'undefined' && !!getAccessToken(),
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 3,
  })
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>('/dashboard/pending-approvals-count')
      return data
    },
    enabled: typeof window !== 'undefined' && !!getAccessToken(),
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 3,
  })
}

export function useActiveOrders() {
  return useQuery({
    queryKey: ['active-orders'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<OrderSummary>>('/orders/active', {
        params: { page: 1, pageSize: 5 },
      })
      return data
    },
    enabled: typeof window !== 'undefined' && !!getAccessToken(),
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 3,
  })
}
