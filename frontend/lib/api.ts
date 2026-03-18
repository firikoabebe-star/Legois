import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management
let accessToken: string | null = null
let refreshToken: string | null = null

export const setTokens = (access: string, refresh: string) => {
  accessToken = access
  refreshToken = refresh
  
  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }
}

export const getTokens = () => {
  if (typeof window !== 'undefined') {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    }
  }
  return { accessToken: null, refreshToken: null }
}

export const clearTokens = () => {
  accessToken = null
  refreshToken = null
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }
}

// Initialize tokens from localStorage
if (typeof window !== 'undefined') {
  const tokens = getTokens()
  accessToken = tokens.accessToken
  refreshToken = tokens.refreshToken
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          })

          const { accessToken: newAccessToken } = response.data.data
          setTokens(newAccessToken, refreshToken)

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          clearTokens()
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login'
          }
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token, redirect to login
        clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  details?: any[]
}

// Generic API methods
export const apiClient = {
  get: <T = any>(url: string): Promise<ApiResponse<T>> =>
    api.get(url).then((res) => res.data),
    
  post: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.post(url, data).then((res) => res.data),
    
  put: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.put(url, data).then((res) => res.data),
    
  patch: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.patch(url, data).then((res) => res.data),
    
  delete: <T = any>(url: string): Promise<ApiResponse<T>> =>
    api.delete(url).then((res) => res.data),
}

export default api