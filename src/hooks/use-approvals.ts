import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ExpenseApproval, PaginatedResponse } from '@/types'

export function usePendingExpenses(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['pending-expenses', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ExpenseApproval>>('/expenses/pending', {
        params: { page, pageSize },
      })
      return data
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

export function useApproveExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ expenseId, confirmationToken }: { expenseId: string; confirmationToken?: string }) => {
      const { data } = await api.post(`/expenses/${expenseId}/approve`, {
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
      const { data } = await api.post(`/expenses/${expenseId}/reject`, { reason })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-expenses'] })
    },
  })
}
