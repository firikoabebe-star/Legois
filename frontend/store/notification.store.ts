import { create } from 'zustand'
import { Notification } from '@/types'
import { apiClient } from '@/lib/api'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearError: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get<{ notifications: Notification[] }>('/notifications')
      
      if (response.success && response.data) {
        set({ 
          notifications: response.data.notifications, 
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch notifications')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch notifications'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await apiClient.get<{ count: number }>('/notifications/unread-count')
      
      if (response.success && response.data) {
        set({ unreadCount: response.data.count })
      }
    } catch (error: any) {
      // Silently fail for unread count
      console.error('Failed to fetch unread count:', error)
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const response = await apiClient.patch<{ notification: Notification }>(`/notifications/${notificationId}/read`)
      
      if (response.success && response.data) {
        const updatedNotification = response.data.notification
        
        set(state => ({
          notifications: state.notifications.map(notification => 
            notification.id === notificationId ? updatedNotification : notification
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }))
      } else {
        throw new Error(response.error || 'Failed to mark notification as read')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to mark notification as read'
      set({ error: errorMessage })
      throw error
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiClient.patch('/notifications/read-all')
      
      if (response.success) {
        set(state => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            isRead: true,
            readAt: new Date().toISOString()
          })),
          unreadCount: 0
        }))
      } else {
        throw new Error(response.error || 'Failed to mark all notifications as read')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to mark all notifications as read'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}`)
      
      if (response.success) {
        set(state => {
          const notification = state.notifications.find(n => n.id === notificationId)
          const wasUnread = notification && !notification.isRead
          
          return {
            notifications: state.notifications.filter(n => n.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
          }
        })
      } else {
        throw new Error(response.error || 'Failed to delete notification')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete notification'
      set({ error: errorMessage })
      throw error
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))