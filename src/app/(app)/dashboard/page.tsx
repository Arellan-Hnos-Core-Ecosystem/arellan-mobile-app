'use client'

import { useAuthStore } from '@/stores/auth'
import { useExecutiveSummary } from '@/hooks/use-dashboard'
import {
  Card,
  CardHeader,
  CardContent,
  Skeleton,
  StatusIndicator,
  CashAmount,
  Badge,
  EmptyState,
  Alert,
  Container,
} from '@arellan-hnos-core-ecosystem/ui'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: summary, isLoading, error } = useExecutiveSummary()

  return (
    <Container size="full" className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">
          Buenos dias, {user?.name?.split(' ')[0] || 'Usuario'}
        </p>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Error al cargar datos"
          description="No se pudo obtener el resumen ejecutivo. Verifique su conexion."
          className="mb-4"
        />
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton variant="rectangular" height={120} width="100%" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton variant="rectangular" height={100} width="100%" />
            <Skeleton variant="rectangular" height={100} width="100%" />
            <Skeleton variant="rectangular" height={100} width="100%" />
            <Skeleton variant="rectangular" height={100} width="100%" />
          </div>
        </div>
      ) : summary ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Ingresos de hoy</p>
                  <CashAmount amount={summary.todayRevenue} size="xl" />
                </div>
                <div className="text-right">
                  <Badge variant={summary.revenueChangePercent >= 0 ? 'success' : 'error'} size="sm">
                    {summary.revenueChangePercent >= 0 ? '+' : ''}
                    {Number(summary.revenueChangePercent || 0).toFixed(1)}% vs ayer
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-4">
                <p className="text-2xs font-medium uppercase tracking-wide text-neutral-400">
                  OT Activas
                </p>
                <p className="mt-1 text-2xl font-bold text-brand-primary">{summary.activeOrders}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <p className="text-2xs font-medium uppercase tracking-wide text-neutral-400">
                  Pendientes
                </p>
                <p className="mt-1 text-2xl font-bold text-status-warning">{summary.pendingApprovals}</p>
                {summary.pendingApprovals > 0 && (
                  <p className="mt-0.5 text-2xs text-status-warning">Requieren atencion</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <p className="text-2xs font-medium uppercase tracking-wide text-neutral-400">
                  Caja
                </p>
                <StatusIndicator
                  status={summary.cashboxOpen ? 'active' : 'error'}
                  label={summary.cashboxOpen ? 'Abierta' : 'Cerrada'}
                  size="sm"
                  pulse={summary.cashboxOpen}
                />
                {summary.cashboxOpen && (
                  <p className="mt-1">
                    <CashAmount amount={summary.cashboxBalance} size="sm" />
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <p className="text-2xs font-medium uppercase tracking-wide text-neutral-400">
                  Variacion
                </p>
                <CashAmount
                  amount={summary.todayRevenue - summary.yesterdayRevenue}
                  size="lg"
                  signed
                />
                <p className="text-2xs text-neutral-400">vs ayer</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-right text-2xs text-neutral-400">
            Actualizado: {new Date(summary.lastUpdated).toLocaleTimeString('es-PE')}
          </p>
        </div>
      ) : (
        <EmptyState
          title="Sin datos disponibles"
          description="No se encontro informacion del resumen ejecutivo."
        />
      )}
    </Container>
  )
}
