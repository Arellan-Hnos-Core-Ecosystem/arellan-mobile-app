'use client'

import { useState } from 'react'
import { useAlerts, useAcknowledgeAlert } from '@/hooks/use-alerts'
import {
  Card,
  CardContent,
  Button,
  Badge,
  Spinner,
  EmptyState,
  Alert as AlertComponent,
  Container,
  Skeleton,
  CashAmount,
} from '@arellan-hnos-core-ecosystem/ui'
import type { AlertItem } from '@/types'

const severityConfig: Record<AlertItem['severity'], { variant: 'error' | 'warning' | 'info'; label: string }> = {
  CRITICAL: { variant: 'error', label: 'Critico' },
  HIGH: { variant: 'error', label: 'Alto' },
  MEDIUM: { variant: 'warning', label: 'Medio' },
  LOW: { variant: 'info', label: 'Bajo' },
}

const typeLabels: Record<AlertItem['type'], string> = {
  CASH_DISCREPANCY: 'Discrepancia de caja',
  GEOFENCE: 'Geocerca',
  AFTER_HOURS: 'Acceso fuera de horario',
  CRITICAL_STOCK: 'Stock critico',
  OTHER: 'Otro',
}

export default function AlertsPage() {
  const [page] = useState(1)
  const { data, isLoading, error } = useAlerts(page, 50)
  const acknowledgeMutation = useAcknowledgeAlert()
  const [ackError, setAckError] = useState<string | null>(null)

  const alerts = data?.data ?? []

  const handleAcknowledge = async (alertId: string) => {
    setAckError(null)
    try {
      await acknowledgeMutation.mutateAsync(alertId)
    } catch {
      setAckError('Error al confirmar la alerta.')
    }
  }

  return (
    <Container size="full" className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Alertas</h1>
        <p className="text-sm text-neutral-500">Historial de alertas del sistema</p>
      </div>

      {ackError && (
        <AlertComponent variant="error" title="Error" description={ackError} className="mb-4" onClose={() => setAckError(null)} />
      )}

      {error && (
        <AlertComponent
          variant="error"
          title="Error al cargar"
          description="No se pudieron cargar las alertas."
          className="mb-4"
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={120} width="100%" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          title="Sin alertas"
          description="No hay alertas registradas en el sistema."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const severity = severityConfig[alert.severity]
            return (
              <Card key={alert.id}>
                <CardContent className="py-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={severity.variant} size="sm">
                          {severity.label}
                        </Badge>
                        <span className="text-xs text-neutral-400">{typeLabels[alert.type]}</span>
                      </div>
                      {alert.acknowledged ? (
                        <Badge variant="success" size="sm">Confirmado</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Pendiente</Badge>
                      )}
                    </div>

                    <p className="text-sm font-medium text-neutral-900">{alert.title}</p>
                    <p className="text-sm text-neutral-600">{alert.description}</p>

                    {alert.amount !== undefined && (
                      <p className="text-sm">
                        <span className="text-neutral-400">Monto: </span>
                        <CashAmount amount={alert.amount} size="sm" />
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-2xs text-neutral-400">
                        {new Date(alert.createdAt).toLocaleString('es-PE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAcknowledge(alert.id)}
                          disabled={acknowledgeMutation.isPending}
                        >
                          Confirmar
                        </Button>
                      )}
                    </div>

                    {alert.acknowledgedBy && (
                      <p className="text-2xs text-neutral-400">
                        Confirmado por {alert.acknowledgedBy} el{' '}
                        {alert.acknowledgedAt
                          ? new Date(alert.acknowledgedAt).toLocaleString('es-PE', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : ''}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </Container>
  )
}
