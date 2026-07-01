import { create } from 'zustand'

/** Статус загрузки токенов при старте приложения. */
type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  userId: string | null
  phone: string | null
  name: string | null
  status: AuthStatus
  isLoggedIn: boolean
  setAuth: (userId: string, phone: string, name: string) => void
  setStatus: (status: AuthStatus) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>(set => ({
  userId: null,
  phone: null,
  name: null,
  status: 'idle',
  isLoggedIn: false,
  setAuth: (userId, phone, name) =>
    set({ userId, phone, name, isLoggedIn: true, status: 'authenticated' }),
  setStatus: status => set({ status }),
  clearAuth: () =>
    set({ userId: null, phone: null, name: null, isLoggedIn: false, status: 'unauthenticated' }),
}))
