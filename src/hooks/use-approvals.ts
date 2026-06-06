import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getAccessToken } from '@/lib/api'
import type { ExpenseApproval, PaginatedResponse } from '@/types'

export function usePendingExpenses(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['pending-expenses', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ExpenseApproval>>('/finance/expenses/pending', {
        params: { page, pageSize },
      })
      return data
    },
    enabled: typeof window !== 'undefined' && !!getAccessToken(),
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 3,
  })
}

export function useApproveExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ expenseId, confirmationToken }: { expenseId: string; confirmationToken?: string }) => {
      const { data } = await api.post(`/finance/expenses/${expenseId}/approve`, {
        decision: 'APPROVED',
        confirmationToken,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-expenses'] })
    },
  })
}

export function useRejectExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ expenseId, reason }: { expenseId: string; reason: string }) => {
      const { data } = await api.post(`/finance/expenses/${expenseId}/approve`, {
        decision: 'REJECTED',
        rejectionReason: reason,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-expenses'] })
    },
  })
}
