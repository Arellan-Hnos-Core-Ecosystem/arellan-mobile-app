import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError, MFAVerifyRequest, MFAVerifyResponse } from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let accessToken: string | null = null
let refreshToken: string | null = null
let mfaToken: string | null = null
let onMFARequired: ((token: string) => Promise<string>) | null = null
let onUnauthorized: (() => void) | null = null

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshToken = refresh
}

export function setMFAToken(token: string) {
  mfaToken = token
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  mfaToken = null
}

export function getAccessToken() {
  return accessToken
}

export function setMFAHandler(handler: (token: string) => Promise<string>) {
  onMFARequired = handler
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

function getApiError(error: AxiosError<ApiError>): ApiError {
  if (error.response?.data) return error.response.data
  if (error.code === 'ECONNABORTED') return { code: 'TIMEOUT', message: 'La solicitud excedio el tiempo de espera' }
  if (!error.response) return { code: 'NETWORK_ERROR', message: 'Error de conexion. Verifique su red.' }
  return { code: 'UNKNOWN', message: 'Error inesperado del servidor' }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  if (mfaToken && config.headers) {
    config.headers['X-MFA-Token'] = mfaToken
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _mfaRetry?: boolean }

    if (error.response?.status === 403) {
      const data = error.response.data
      if (data?.code === 'MFA_REQUIRED' && !originalRequest._mfaRetry && onMFARequired) {
        const mfaTokenHeader = (error.response.headers as Record<string, string>)?.['x-mfa-token'] || ''
        try {
          const code = await onMFARequired(mfaTokenHeader)
          originalRequest._mfaRetry = true
          originalRequest.headers['X-MFA-Code'] = code
          return api(originalRequest)
        } catch {
          return Promise.reject(getApiError(error))
        }
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      clearTokens()
      onUnauthorized?.()
      return Promise.reject(getApiError(error))
    }

    return Promise.reject(getApiError(error))
  }
)

export { api, getApiError }
export default api
