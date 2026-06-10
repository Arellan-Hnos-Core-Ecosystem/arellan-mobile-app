'use client'

import { useState } from 'react'
import { useAlerts, useAcknowledgeAlert } from '@/hooks/use-alerts'
import { useRealtime } from '@/hooks/use-realtime'
import { api } from '@/lib/api'
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
  Input,
  FormField,
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
  const { cashboxBlocked, clearCashboxBlocked } = useRealtime()
  const [ackError, setAckError] = useState<string | null>(null)

  const [totpCode, setTotpCode] = useState("")
  const [overrideReason, setOverrideReason] = useState("")
  const [overriding, setOverriding] = useState(false)
  const [overrideError, setOverrideError] = useState<string | null>(null)
  const [overrideSuccess, setOverrideSuccess] = useState(false)

  const handleCashboxOverride = async () => {
    if (!cashboxBlocked || totpCode.length !== 6) return
    setOverriding(true)
    setOverrideError(null)
    try {
      await api.post("/finance/cashbox/override", {
        sessionId: cashboxBlocked.sessionId,
        totpCode,
        overrideReason: overrideReason.trim() || undefined,
      })
      setOverrideSuccess(true)
      setTotpCode("")
      clearCashboxBlocked()
    } catch (err: any) {
      setOverrideError(err.response?.data?.message ?? err.message ?? "Error al procesar el override.")
    } finally {
      setOverriding(false)
    }
  }

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

      {/* CASHBOX BLOCKED — Override Card (Anti-Fraude #2) */}
      {cashboxBlocked && !overrideSuccess && (
        <Card className="mb-4 border-2 border-red-500 bg-red-50">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">🔒</span>
              <div>
                <p className="text-base font-bold text-red-900">CAJA BLOQUEADA — Acción Obligatoria</p>
                <p className="text-xs text-red-700">Sesión: {cashboxBlocked.sessionId.slice(0, 8)}…</p>
              </div>
            </div>
            <p className="text-sm text-red-800">{cashboxBlocked.description}</p>
            <FormField label="Código Google Authenticator (6 dígitos)" error={overrideError ?? undefined}>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="● ● ● ● ● ●"
                value={totpCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  setOverrideError(null)
                }}
                className="text-center text-lg tracking-widest"
              />
            </FormField>
            <FormField label="Motivo del override (opcional)">
              <Input
                type="text"
                placeholder="Ej: Error de conteo verificado con cámara"
                value={overrideReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOverrideReason(e.target.value)}
              />
            </FormField>
            <Button
              variant="danger"
              className="w-full min-h-[48px] font-bold"
              disabled={totpCode.length !== 6 || overriding}
              onClick={handleCashboxOverride}
            >
              {overriding ? (
                <span className="flex items-center gap-2"><Spinner size="sm" /> Verificando TOTP...</span>
              ) : (
                "Autorizar Forzado con TOTP"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {overrideSuccess && (
        <AlertComponent variant="success" title="Override exitoso" description="La caja ha sido normalizada. Las operaciones del taller han sido reanudadas." className="mb-4" onClose={() => setOverrideSuccess(false)} />
      )}

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
