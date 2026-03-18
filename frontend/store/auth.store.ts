import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthResponse, LoginForm, RegisterForm } from '@/types'
import { apiClient, setTokens, clearTokens, getTokens } from '@/lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (data: LoginForm) => Promise<void>
  register: (data: RegisterForm) => Promise<void>
  logout: () => void
  getCurrentUser: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  clearError: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data: LoginForm) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await apiClient.post<AuthResponse>('/auth/login', data)
          
          if (response.success && response.data) {
            const { user, accessToken, refreshToken } = response.data
            setTokens(accessToken, refreshToken)
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false 
            })
          } else {
            throw new Error(response.error || 'Login failed')
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || 'Login failed'
          set({ 
            error: errorMessage, 
            isLoading: false,
            isAuthenticated: false,
            user: null
          })
          throw error
        }
      },

      register: async (data: RegisterForm) => {
        try {
          set({ isLoading: true, error: null })
          
          const { confirmPassword, ...registerData } = data
          const response = await apiClient.post<AuthResponse>('/auth/register', registerData)
          
          if (response.success && response.data) {
            const { user, accessToken, refreshToken } = response.data
            setTokens(accessToken, refreshToken)
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false 
            })
          } else {
            throw new Error(response.error || 'Registration failed')
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || 'Registration failed'
          set({ 
            error: errorMessage, 
            isLoading: false,
            isAuthenticated: false,
            user: null
          })
          throw error
        }
      },

      logout: () => {
        clearTokens()
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        })
      },

      getCurrentUser: async () => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await apiClient.get<{ user: User }>('/auth/me')
          
          if (response.success && response.data) {
            set({ 
              user: response.data.user, 
              isAuthenticated: true, 
              isLoading: false 
            })
          } else {
            throw new Error('Failed to get user')
          }
        } catch (error: any) {
          // If getting current user fails, user is likely not authenticated
          get().logout()
          set({ isLoading: false })
        }
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await apiClient.patch<{ user: User }>('/auth/profile', data)
          
          if (response.success && response.data) {
            set({ 
              user: response.data.user, 
              isLoading: false 
            })
          } else {
            throw new Error(response.error || 'Failed to update profile')
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to update profile'
          set({ 
            error: errorMessage, 
            isLoading: false 
          })
          throw error
        }
      },

      clearError: () => {
        set({ error: null })
      },

      initialize: async () => {
        const tokens = getTokens()
        if (tokens.accessToken) {
          await get().getCurrentUser()
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)