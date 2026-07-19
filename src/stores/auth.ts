import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api, setTokens, clearTokens, setMFAToken, setMFAHandler, setUnauthorizedHandler, setIsLoggingOut } from "@/lib/api";
import type { User, LoginRequest, LoginResponse, MFAVerifyRequest, MFAVerifyResponse } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  mfaToken: string | null;
  forceLogoutEnabled: boolean;

  login: (data: LoginRequest) => Promise<LoginResponse>;
  verifyMFA: (code: string) => Promise<void>;
  cancelMFA: () => void;
  logout: () => Promise<void>;
  forceLogout: (userId: string) => Promise<void>;
  setUser: (user: User) => void;
  setForceLogoutEnabled: (enabled: boolean) => void;
}

async function bffLogin(body: LoginRequest): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json() as LoginResponse & { message?: string };
  if (!res.ok) throw new Error(data.message ?? "Error al iniciar sesion");
  return data;
}

async function bffMfaVerify(mfaToken: string, code: string): Promise<MFAVerifyResponse> {
  // FUN-20: verify contra la ruta BFF dedicada (proxy de /auth/mfa/verify) —
  // antes se posteaba {mfaToken, code} al proxy de login (contrato imposible).
  const body: MFAVerifyRequest = { mfaToken, code };
  const res = await fetch("/api/auth/mfa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json() as MFAVerifyResponse & { message?: string };
  if (!res.ok) throw new Error(data.message ?? "Codigo MFA invalido");
  return data;
}

const storage =
  typeof window !== "undefined"
    ? createJSONStorage(() => localStorage)
    : createJSONStorage(() => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }));

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      setMFAHandler(async (token: string) => {
        return new Promise<string>((resolve, reject) => {
          set({ mfaRequired: true, mfaToken: token });
          const unsubscribe = useAuthStore.subscribe((state) => {
            if (!state.mfaRequired && state.isAuthenticated) {
              unsubscribe();
              resolve("");
            }
          });
          setTimeout(() => {
            unsubscribe();
            set({ mfaRequired: false, mfaToken: null });
            reject(new Error("MFA timeout"));
          }, 300000);
        });
      });

      setUnauthorizedHandler(() => {
        set({ user: null, isAuthenticated: false, mfaRequired: false, mfaToken: null });
        clearTokens();
        fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      });

      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        mfaRequired: false,
        mfaToken: null,
        forceLogoutEnabled: false,

        login: async (data: LoginRequest) => {
          set({ isLoading: true });
          try {
            const result = await bffLogin(data);

            if (result.mfaRequired) {
              set({ mfaRequired: true, mfaToken: result.mfaToken ?? null, isLoading: false });
              return result;
            }

            if (result.user && result.tokens) {
              setTokens(result.tokens.accessToken);
              set({
                user: result.user,
                isAuthenticated: true,
                isLoading: false,
                mfaRequired: false,
                mfaToken: null,
                forceLogoutEnabled: result.user.role === "OWNER",
              });
              return result;
            }

            set({ isLoading: false });
            return result;
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        verifyMFA: async (code: string) => {
          const { mfaToken } = get();
          if (!mfaToken) throw new Error("No MFA token available");

          set({ isLoading: true });
          try {
            const { user, tokens } = await bffMfaVerify(mfaToken, code);
            setTokens(tokens.accessToken);
            setMFAToken("");
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              mfaRequired: false,
              mfaToken: null,
              forceLogoutEnabled: user.role === "OWNER",
            });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        cancelMFA: () => {
          set({ mfaRequired: false, mfaToken: null, isLoading: false });
          setMFAToken("");
        },

        logout: async () => {
          setIsLoggingOut(true);
          try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
          } catch {
            // logout even if call fails
          }
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            mfaRequired: false,
            mfaToken: null,
            forceLogoutEnabled: false,
          });
          setIsLoggingOut(false);
        },

        forceLogout: async (userId: string) => {
          await api.post("/auth/force-logout", { userId });
        },

        setUser: (user: User) => set({ user }),
        setForceLogoutEnabled: (enabled: boolean) => set({ forceLogoutEnabled: enabled }),
      };
    },
    {
      name: "arellan-auth",
      storage,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        forceLogoutEnabled: state.forceLogoutEnabled,
      }),
    }
  )
);
