import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ExecutiveSummary, ExpenseApproval, OrderSummary, PaginatedResponse } from '@/types'

export function useExecutiveSummary() {
  return useQuery({
    queryKey: ['executive-summary'],
    queryFn: async () => {
      const { data } = await api.get<ExecutiveSummary>('/dashboard/summary')
      return data
    },
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>('/dashboard/pending-approvals-count')
      return data
    },
    refetchInterval: 30000,
    staleTime: 15000,
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
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

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
  const { refetch: refetchExpenses } = usePendingExpenses()
  const { refetch: refetchSummary } = useExecutiveSummary()

  return {
    mutateAsync: async (expenseId: string) => {
      const { data } = await api.post(`/expenses/${expenseId}/approve`)
      await refetchExpenses()
      await refetchSummary()
      return data
    },
  }
}

export function useRejectExpense() {
  const { refetch: refetchExpenses } = usePendingExpenses()
  const { refetch: refetchSummary } = useExecutiveSummary()

  return {
    mutateAsync: async (expenseId: string, reason: string) => {
      const { data } = await api.post(`/expenses/${expenseId}/reject`, { reason })
      await refetchExpenses()
      await refetchSummary()
      return data
    },
  }
}
