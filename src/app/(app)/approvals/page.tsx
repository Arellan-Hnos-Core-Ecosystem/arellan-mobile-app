'use client'

import { useState } from 'react'
import { usePendingExpenses, useApproveExpense, useRejectExpense } from '@/hooks/use-approvals'
import {
  Card,
  CardContent,
  Button,
  CashAmount,
  Badge,
  Spinner,
  EmptyState,
  Alert,
  ConfirmDialog,
  Container,
  Skeleton,
} from '@arellan-hnos-core-ecosystem/ui'

export default function ApprovalsPage() {
  const [page] = useState(1)
  const { data, isLoading, error } = usePendingExpenses(page, 50)
  const approveMutation = useApproveExpense()
  const rejectMutation = useRejectExpense()
  const [confirmingApprove, setConfirmingApprove] = useState<string | null>(null)
  const [confirmingReject, setConfirmingReject] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleApprove = async (expenseId: string, amount: number) => {
    setActionError(null)
    try {
      if (amount > 500) {
        setConfirmingApprove(expenseId)
      } else {
        await approveMutation.mutateAsync({ expenseId })
      }
    } catch {
      setActionError('Error al aprobar el gasto. Intente nuevamente.')
    }
  }

  const confirmApprove = async () => {
    if (!confirmingApprove) return
    setActionError(null)
    try {
      await approveMutation.mutateAsync({ expenseId: confirmingApprove })
      setConfirmingApprove(null)
    } catch {
      setActionError('Error al aprobar el gasto. Intente nuevamente.')
    }
  }

  const handleReject = (expenseId: string) => {
    setConfirmingReject(expenseId)
  }

  const confirmReject = async () => {
    if (!confirmingReject) return
    setActionError(null)
    try {
      await rejectMutation.mutateAsync({ expenseId: confirmingReject, reason: 'Rechazado por gerencia' })
      setConfirmingReject(null)
    } catch {
      setActionError('Error al rechazar el gasto. Intente nuevamente.')
    }
  }

  const expenses = data?.data ?? []

  return (
    <Container size="full" className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Aprobaciones</h1>
        <p className="text-sm text-neutral-500">Gastos pendientes de aprobacion</p>
      </div>

      {actionError && (
        <Alert variant="error" title="Error" description={actionError} className="mb-4" onClose={() => setActionError(null)} />
      )}

      {error && (
        <Alert
          variant="error"
          title="Error al cargar"
          description="No se pudieron cargar los gastos pendientes."
          className="mb-4"
        />
      )}

      {(approveMutation.isPending || rejectMutation.isPending) && (
        <div className="mb-4 flex items-center justify-center py-4">
          <Spinner size="md" label="Procesando..." />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={140} width="100%" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          title="Sin gastos pendientes"
          description="No hay gastos que requieran aprobacion en este momento."
          action={
            <svg className="h-16 w-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="py-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Badge variant="warning" size="sm">{expense.category}</Badge>
                      <p className="mt-1.5 text-sm font-medium text-neutral-900 line-clamp-2">
                        {expense.description}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        Solicitado por: {expense.requesterName} ({expense.requesterRole})
                      </p>
                      <p className="text-2xs text-neutral-400">
                        {new Date(expense.createdAt).toLocaleString('es-PE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <CashAmount amount={expense.amount} size="xl" className="shrink-0 ml-3" />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={() => handleApprove(expense.id, expense.amount)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      Aprobar
                    </Button>
                    <Button
                      variant="danger"
                      size="lg"
                      fullWidth
                      onClick={() => handleReject(expense.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmingApprove}
        onClose={() => setConfirmingApprove(null)}
        onConfirm={confirmApprove}
        title="Confirmar aprobacion"
        description="Este gasto supera los S/. 500. Esta seguro de aprobarlo?"
        confirmLabel="Si, aprobar"
        cancelLabel="Cancelar"
        variant="warning"
        isLoading={approveMutation.isPending}
      />

      <ConfirmDialog
        open={!!confirmingReject}
        onClose={() => setConfirmingReject(null)}
        onConfirm={confirmReject}
        title="Confirmar rechazo"
        description="Esta seguro de rechazar este gasto? Esta accion no se puede deshacer."
        confirmLabel="Si, rechazar"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={rejectMutation.isPending}
      />
    </Container>
  )
}
