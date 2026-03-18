import { create } from 'zustand'
import { apiClient } from '@/lib/api'

export interface AdminStats {
  totalUsers: number
  totalWorkspaces: number
  totalPages: number
  totalBlocks: number
  activeUsers: number
  newUsersThisMonth: number
  newWorkspacesThisMonth: number
}

export interface AdminUser {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
  workspaceMembers: {
    workspace: {
      id: string
      name: string
    }
    role: {
      name: string
    }
  }[]
  _count: {
    createdPages: number
    comments: number
  }
}

export interface AdminWorkspace {
  id: string
  name: string
  description?: string
  icon?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    username: string
    email: string
  }
  _count: {
    members: number
    pages: number
  }
}

export interface ActivityLogItem {
  id: string
  action: string
  entity: string
  entityId: string
  details?: any
  createdAt: string
  user: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
  workspace?: {
    id: string
    name: string
  }
  page?: {
    id: string
    title: string
  }
}

export interface GrowthMetrics {
  userGrowth: { date: string; count: number }[]
  workspaceGrowth: { date: string; count: number }[]
}

interface AdminState {
  // Data
  stats: AdminStats | null
  users: AdminUser[]
  workspaces: AdminWorkspace[]
  activities: ActivityLogItem[]
  growthMetrics: GrowthMetrics | null
  
  // Pagination
  usersPagination: {
    page: number
    totalPages: number
    total: number
  }
  workspacesPagination: {
    page: number
    totalPages: number
    total: number
  }
  
  // Loading states
  isLoading: boolean
  isLoadingUsers: boolean
  isLoadingWorkspaces: boolean
  isLoadingActivities: boolean
  
  // Error state
  error: string | null
  
  // Actions
  fetchStats: () => Promise<void>
  fetchUsers: (page?: number, search?: string) => Promise<void>
  fetchWorkspaces: (page?: number, search?: string) => Promise<void>
  fetchActivities: (limit?: number) => Promise<void>
  fetchGrowthMetrics: () => Promise<void>
  suspendUser: (userId: string) => Promise<void>
  reactivateUser: (userId: string) => Promise<void>
  deleteWorkspace: (workspaceId: string) => Promise<void>
  clearError: () => void
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial state
  stats: null,
  users: [],
  workspaces: [],
  activities: [],
  growthMetrics: null,
  usersPagination: { page: 1, totalPages: 1, total: 0 },
  workspacesPagination: { page: 1, totalPages: 1, total: 0 },
  isLoading: false,
  isLoadingUsers: false,
  isLoadingWorkspaces: false,
  isLoadingActivities: false,
  error: null,

  fetchStats: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get<{ stats: AdminStats }>('/admin/stats')
      
      if (response.success && response.data) {
        set({ 
          stats: response.data.stats,
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch stats')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch stats'
      set({ 
        error: errorMessage,
        isLoading: false 
      })
    }
  },

  fetchUsers: async (page = 1, search?: string) => {
    try {
      set({ isLoadingUsers: true, error: null })
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      })
      
      const response = await apiClient.get<{
        users: AdminUser[]
        total: number
        totalPages: number
      }>(`/admin/users?${params}`)
      
      if (response.success && response.data) {
        set({ 
          users: response.data.users,
          usersPagination: {
            page,
            totalPages: response.data.totalPages,
            total: response.data.total,
          },
          isLoadingUsers: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch users')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch users'
      set({ 
        error: errorMessage,
        isLoadingUsers: false 
      })
    }
  },

  fetchWorkspaces: async (page = 1, search?: string) => {
    try {
      set({ isLoadingWorkspaces: true, error: null })
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      })
      
      const response = await apiClient.get<{
        workspaces: AdminWorkspace[]
        total: number
        totalPages: number
      }>(`/admin/workspaces?${params}`)
      
      if (response.success && response.data) {
        set({ 
          workspaces: response.data.workspaces,
          workspacesPagination: {
            page,
            totalPages: response.data.totalPages,
            total: response.data.total,
          },
          isLoadingWorkspaces: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch workspaces')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch workspaces'
      set({ 
        error: errorMessage,
        isLoadingWorkspaces: false 
      })
    }
  },

  fetchActivities: async (limit = 50) => {
    try {
      set({ isLoadingActivities: true, error: null })
      
      const response = await apiClient.get<{ activities: ActivityLogItem[] }>(`/admin/activity?limit=${limit}`)
      
      if (response.success && response.data) {
        set({ 
          activities: response.data.activities,
          isLoadingActivities: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch activities')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch activities'
      set({ 
        error: errorMessage,
        isLoadingActivities: false 
      })
    }
  },

  fetchGrowthMetrics: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get<{ metrics: GrowthMetrics }>('/admin/metrics/growth')
      
      if (response.success && response.data) {
        set({ 
          growthMetrics: response.data.metrics,
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch growth metrics')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch growth metrics'
      set({ 
        error: errorMessage,
        isLoading: false 
      })
    }
  },

  suspendUser: async (userId: string) => {
    try {
      set({ error: null })
      
      const response = await apiClient.post(`/admin/users/${userId}/suspend`)
      
      if (response.success) {
        // Refresh users list
        const { usersPagination } = get()
        await get().fetchUsers(usersPagination.page)
      } else {
        throw new Error(response.error || 'Failed to suspend user')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to suspend user'
      set({ error: errorMessage })
      throw error
    }
  },

  reactivateUser: async (userId: string) => {
    try {
      set({ error: null })
      
      const response = await apiClient.post(`/admin/users/${userId}/reactivate`)
      
      if (response.success) {
        // Refresh users list
        const { usersPagination } = get()
        await get().fetchUsers(usersPagination.page)
      } else {
        throw new Error(response.error || 'Failed to reactivate user')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to reactivate user'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteWorkspace: async (workspaceId: string) => {
    try {
      set({ error: null })
      
      const response = await apiClient.delete(`/admin/workspaces/${workspaceId}`)
      
      if (response.success) {
        // Refresh workspaces list
        const { workspacesPagination } = get()
        await get().fetchWorkspaces(workspacesPagination.page)
      } else {
        throw new Error(response.error || 'Failed to delete workspace')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete workspace'
      set({ error: errorMessage })
      throw error
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))