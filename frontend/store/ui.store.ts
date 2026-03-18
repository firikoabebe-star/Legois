import { create } from 'zustand'
import { Toast, Modal } from '@/types'

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // Sidebar
  sidebarCollapsed: boolean
  
  // Toasts
  toasts: Toast[]
  
  // Modals
  modals: Modal[]
  
  // Loading states
  globalLoading: boolean
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  
  // Modal actions
  openModal: (modal: Omit<Modal, 'id' | 'isOpen'>) => string
  closeModal: (id: string) => void
  closeAllModals: () => void
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void
}

let toastIdCounter = 0
let modalIdCounter = 0

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'system',
  sidebarCollapsed: false,
  toasts: [],
  modals: [],
  globalLoading: false,

  setTheme: (theme) => {
    set({ theme })
    
    // Apply theme to document
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        root.classList.add(systemTheme)
      } else {
        root.classList.add(theme)
      }
      
      // Store in localStorage
      localStorage.setItem('theme', theme)
    }
  },

  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed })
  },

  addToast: (toast) => {
    const id = `toast-${++toastIdCounter}`
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    }
    
    set(state => ({
      toasts: [...state.toasts, newToast]
    }))
    
    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, newToast.duration)
    }
  },

  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }))
  },

  clearToasts: () => {
    set({ toasts: [] })
  },

  openModal: (modal) => {
    const id = `modal-${++modalIdCounter}`
    const newModal: Modal = {
      id,
      isOpen: true,
      ...modal,
    }
    
    set(state => ({
      modals: [...state.modals, newModal]
    }))
    
    return id
  },

  closeModal: (id) => {
    set(state => ({
      modals: state.modals.map(modal =>
        modal.id === id ? { ...modal, isOpen: false } : modal
      )
    }))
    
    // Remove modal after animation
    setTimeout(() => {
      set(state => ({
        modals: state.modals.filter(modal => modal.id !== id)
      }))
    }, 200)
  },

  closeAllModals: () => {
    set(state => ({
      modals: state.modals.map(modal => ({ ...modal, isOpen: false }))
    }))
    
    // Remove all modals after animation
    setTimeout(() => {
      set({ modals: [] })
    }, 200)
  },

  setGlobalLoading: (loading) => {
    set({ globalLoading: loading })
  },
}))

// Initialize theme from localStorage
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
  if (savedTheme) {
    useUIStore.getState().setTheme(savedTheme)
  }
}