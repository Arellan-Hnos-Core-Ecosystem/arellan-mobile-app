'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  Alert,
  Spinner,
} from '@arellan-hnos-core-ecosystem/ui'
import { useAuthStore } from '@/stores/auth'

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es requerido').email('Correo invalido'),
  password: z.string().min(1, 'La contrasena es requerida').min(6, 'Minimo 6 caracteres'),
})

const mfaSchema = z.object({
  code: z.string().min(1, 'El codigo es requerido').length(6, 'El codigo debe tener 6 digitos'),
})

type LoginFormData = z.infer<typeof loginSchema>
type MFAFormData = z.infer<typeof mfaSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, verifyMFA, cancelMFA, mfaRequired, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: mfaRegister,
    handleSubmit: handleMFASubmit,
    formState: { errors: mfaErrors },
  } = useForm<MFAFormData>({
    resolver: zodResolver(mfaSchema),
  })

  const onLoginSubmit = async (data: LoginFormData) => {
    setError(null)
    try {
      const result = await login(data)
      if (!result.mfaRequired) {
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesion'
      setError(msg)
    }
  }

  const onMFASubmit = async (data: MFAFormData) => {
    setError(null)
    try {
      await verifyMFA(data.code)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Codigo MFA invalido'
      setError(msg)
    }
  }

  const handleCancelMFA = () => {
    cancelMFA()
    setError(null)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" label="Iniciando sesion..." />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-primary px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
          <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z" />
            <circle cx="7.5" cy="14.5" r="1.5" />
            <circle cx="16.5" cy="14.5" r="1.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Arellan Hnos</h1>
        <p className="mt-1 text-sm text-brand-200">Panel Gerencial</p>
      </div>

      <Card className="w-full max-w-md">
        {mfaRequired ? (
          <form onSubmit={handleMFASubmit(onMFASubmit)}>
            <CardHeader>
              <h2 className="text-lg font-semibold text-neutral-900">Verificacion en dos pasos</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Ingrese el codigo de 6 digitos de su aplicacion autenticadora
              </p>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="error" title="Error" description={error} className="mb-4" />
              )}
              <Input
                label="Codigo MFA"
                inputSize="lg"
                placeholder="000000"
                maxLength={6}
                error={mfaErrors.code?.message}
                {...mfaRegister('code')}
                autoComplete="one-time-code"
                inputMode="numeric"
                autoFocus
              />
            </CardContent>
            <CardFooter>
              <div className="flex w-full gap-3">
                <Button variant="ghost" fullWidth onClick={handleCancelMFA} type="button">
                  Cancelar
                </Button>
                <Button variant="primary" fullWidth size="lg" type="submit">
                  Verificar
                </Button>
              </div>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit(onLoginSubmit)}>
            <CardHeader>
              <h2 className="text-lg font-semibold text-neutral-900">Iniciar sesion</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Acceda con sus credenciales corporativas
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="error" title="Error" description={error} />
              )}
              <Input
                label="Correo electronico"
                type="email"
                inputSize="lg"
                placeholder="usuario@arellanhnos.com"
                error={loginErrors.email?.message}
                {...loginRegister('email')}
                autoComplete="email"
                autoFocus
              />
              <Input
                label="Contrasena"
                type="password"
                inputSize="lg"
                placeholder="••••••••"
                error={loginErrors.password?.message}
                {...loginRegister('password')}
                autoComplete="current-password"
              />
            </CardContent>
            <CardFooter>
              <Button variant="primary" fullWidth size="xl" type="submit">
                Ingresar
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-brand-200">
        Clinica Automotriz Arellan Hnos &copy; {new Date().getFullYear()}
      </p>
    </div>
  )
}
