import { create } from 'zustand'
import { googleAuth, AuthTokens } from '@/services/googleAuth'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  tokens: AuthTokens | null
  initialize: () => Promise<void>
  signIn: () => Promise<void>
  signOut: () => void
  clearError: () => void
  getAccessToken: () => string | null
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tokens: null,

  initialize: async () => {
    await googleAuth.initialize()
    const hasTokens = googleAuth.loadTokensFromStorage()
    if (hasTokens) {
      set({ isAuthenticated: true })
    }
  },

  signIn: async () => {
    set({ isLoading: true, error: null })
    try {
      const tokens = await googleAuth.signIn()
      set({ isAuthenticated: true, tokens, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      set({ error: message, isLoading: false, isAuthenticated: false })
    }
  },

  signOut: () => {
    googleAuth.signOut()
    set({ isAuthenticated: false, tokens: null, error: null })
  },

  clearError: () => set({ error: null }),

  getAccessToken: () => googleAuth.getAccessToken(),
}))
