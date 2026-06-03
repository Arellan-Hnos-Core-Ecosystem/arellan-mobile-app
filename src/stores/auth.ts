import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, setTokens, clearTokens, setMFAToken, setMFAHandler, setUnauthorizedHandler } from '@/lib/api'
import type { User, LoginRequest, LoginResponse, MFAVerifyRequest, MFAVerifyResponse } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  mfaRequired: boolean
  mfaToken: string | null
  forceLogoutEnabled: boolean

  login: (data: LoginRequest) => Promise<LoginResponse>
  verifyMFA: (code: string) => Promise<void>
  cancelMFA: () => void
  logout: () => Promise<void>
  forceLogout: (userId: string) => Promise<void>
  setUser: (user: User) => void
  setForceLogoutEnabled: (enabled: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      setMFAHandler(async (token: string) => {
        return new Promise<string>((resolve, reject) => {
          set({ mfaRequired: true, mfaToken: token })
          const unsubscribe = useAuthStore.subscribe((state) => {
            if (!state.mfaRequired && state.isAuthenticated) {
              unsubscribe()
              resolve('')
            }
          })
          setTimeout(() => {
            unsubscribe()
            set({ mfaRequired: false, mfaToken: null })
            reject(new Error('MFA timeout'))
          }, 300000)
        })
      })

      setUnauthorizedHandler(() => {
        set({ user: null, isAuthenticated: false, mfaRequired: false, mfaToken: null })
        clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      })

      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        mfaRequired: false,
        mfaToken: null,
        forceLogoutEnabled: false,

        login: async (data: LoginRequest) => {
          set({ isLoading: true })
          try {
            const response = await api.post<LoginResponse>('/auth/login', data)
            const result = response.data

            if (result.mfaRequired && result.mfaToken) {
              set({ mfaRequired: true, mfaToken: result.mfaToken, isLoading: false })
              return result
            }

            if (result.user && result.tokens) {
              setTokens(result.tokens.accessToken, result.tokens.refreshToken)
              set({
                user: result.user,
                isAuthenticated: true,
                isLoading: false,
                mfaRequired: false,
                mfaToken: null,
                forceLogoutEnabled: result.user.role === 'OWNER',
              })
            }

            set({ isLoading: false })
            return result
          } catch (error) {
            set({ isLoading: false })
            throw error
          }
        },

        verifyMFA: async (code: string) => {
          const { mfaToken } = get()
          if (!mfaToken) throw new Error('No MFA token available')

          set({ isLoading: true })
          try {
            const response = await api.post<MFAVerifyResponse>('/auth/mfa/verify', {
              mfaToken,
              code,
            } as MFAVerifyRequest)

            const { user, tokens } = response.data
            setTokens(tokens.accessToken, tokens.refreshToken)
            setMFAToken('')
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              mfaRequired: false,
              mfaToken: null,
              forceLogoutEnabled: user.role === 'OWNER',
            })
          } catch (error) {
            set({ isLoading: false })
            throw error
          }
        },

        cancelMFA: () => {
          set({ mfaRequired: false, mfaToken: null, isLoading: false })
          setMFAToken('')
        },

        logout: async () => {
          try {
            await api.post('/auth/logout')
          } catch {
            // logout even if API call fails
          }
          clearTokens()
          set({
            user: null,
            isAuthenticated: false,
            mfaRequired: false,
            mfaToken: null,
            forceLogoutEnabled: false,
          })
        },

        forceLogout: async (userId: string) => {
          await api.post('/auth/force-logout', { userId })
        },

        setUser: (user: User) => set({ user }),

        setForceLogoutEnabled: (enabled: boolean) => set({ forceLogoutEnabled: enabled }),
      }
    },
    {
      name: 'arellan-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        forceLogoutEnabled: state.forceLogoutEnabled,
      }),
    }
  )
)
