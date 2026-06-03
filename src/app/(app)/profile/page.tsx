'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Badge,
  ConfirmDialog,
  Container,
  Spinner,
} from '@arellan-hnos-core-ecosystem/ui'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout, forceLogoutEnabled } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.push('/login')
    } catch {
      setIsLoggingOut(false)
    }
  }

  const confirmLogout = async () => {
    setShowLogoutConfirm(false)
    await handleLogout()
  }

  const roleLabels: Record<string, string> = {
    OWNER: 'Propietario',
    ADMIN: 'Administrador',
  }

  return (
    <Container size="full" className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Perfil</h1>
        <p className="text-sm text-neutral-500">Informacion de su cuenta</p>
      </div>

      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
              <span className="text-2xl font-bold text-brand-primary">
                {user?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || '??'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-neutral-900">{user?.name || 'Usuario'}</p>
              <p className="text-sm text-neutral-500">{user?.email || ''}</p>
              <div className="mt-1.5">
                <Badge variant="brand" size="sm">
                  {user?.role ? roleLabels[user.role] || user.role : ''}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-neutral-900">Informacion de la cuenta</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">Nombre</span>
              <span className="text-sm font-medium text-neutral-900">{user?.name || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">Correo</span>
              <span className="text-sm font-medium text-neutral-900">{user?.email || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">Rol</span>
              <Badge variant="brand" size="sm">
                {user?.role ? roleLabels[user.role] || user.role : ''}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">MFA</span>
              <Badge variant="success" size="sm">Activado</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-neutral-900">Aplicacion</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">Version</span>
              <span className="text-sm font-medium text-neutral-900">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">Entorno</span>
              <Badge variant="warning" size="sm">Desarrollo</Badge>
            </div>
          </CardContent>
        </Card>

        <CardFooter className="p-0">
          <Button
            variant="danger"
            size="xl"
            fullWidth
            onClick={() => setShowLogoutConfirm(true)}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? <Spinner size="sm" label="Cerrando sesion..." /> : 'Cerrar sesion'}
          </Button>
        </CardFooter>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Cerrar sesion"
        description="Esta seguro de que desea cerrar sesion?"
        confirmLabel="Cerrar sesion"
        cancelLabel="Cancelar"
        variant="warning"
      />
    </Container>
  )
}
