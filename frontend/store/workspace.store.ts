import { create } from 'zustand'
import { Workspace, CreateWorkspaceForm, Role } from '@/types'
import { apiClient } from '@/lib/api'

interface WorkspaceState {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  roles: Role[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchWorkspaces: () => Promise<void>
  fetchWorkspace: (id: string) => Promise<void>
  createWorkspace: (data: CreateWorkspaceForm) => Promise<Workspace>
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  setCurrentWorkspace: (workspace: Workspace | null) => void
  inviteMember: (workspaceId: string, email: string, roleId: string) => Promise<void>
  removeMember: (workspaceId: string, memberId: string) => Promise<void>
  fetchRoles: () => Promise<void>
  clearError: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  roles: [],
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get<{ workspaces: Workspace[] }>('/workspaces')
      
      if (response.success && response.data) {
        set({ 
          workspaces: response.data.workspaces, 
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch workspaces')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch workspaces'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
    }
  },

  fetchWorkspace: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get<{ workspace: Workspace }>(`/workspaces/${id}`)
      
      if (response.success && response.data) {
        const workspace = response.data.workspace
        
        // Update workspace in list if it exists
        const workspaces = get().workspaces.map(w => 
          w.id === workspace.id ? workspace : w
        )
        
        set({ 
          workspaces,
          currentWorkspace: workspace,
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch workspace')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch workspace'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
    }
  },

  createWorkspace: async (data: CreateWorkspaceForm) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.post<{ workspace: Workspace }>('/workspaces', data)
      
      if (response.success && response.data) {
        const newWorkspace = response.data.workspace
        
        set(state => ({ 
          workspaces: [newWorkspace, ...state.workspaces],
          isLoading: false 
        }))
        
        return newWorkspace
      } else {
        throw new Error(response.error || 'Failed to create workspace')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create workspace'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      throw error
    }
  },

  updateWorkspace: async (id: string, data: Partial<Workspace>) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.patch<{ workspace: Workspace }>(`/workspaces/${id}`, data)
      
      if (response.success && response.data) {
        const updatedWorkspace = response.data.workspace
        
        set(state => ({
          workspaces: state.workspaces.map(w => 
            w.id === id ? updatedWorkspace : w
          ),
          currentWorkspace: state.currentWorkspace?.id === id ? updatedWorkspace : state.currentWorkspace,
          isLoading: false
        }))
      } else {
        throw new Error(response.error || 'Failed to update workspace')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update workspace'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      throw error
    }
  },

  deleteWorkspace: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.delete(`/workspaces/${id}`)
      
      if (response.success) {
        set(state => ({
          workspaces: state.workspaces.filter(w => w.id !== id),
          currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
          isLoading: false
        }))
      } else {
        throw new Error(response.error || 'Failed to delete workspace')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete workspace'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      throw error
    }
  },

  setCurrentWorkspace: (workspace: Workspace | null) => {
    set({ currentWorkspace: workspace })
  },

  inviteMember: async (workspaceId: string, email: string, roleId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.post(`/workspaces/${workspaceId}/invite`, {
        email,
        roleId
      })
      
      if (response.success) {
        // Refresh workspace to get updated member list
        await get().fetchWorkspace(workspaceId)
      } else {
        throw new Error(response.error || 'Failed to invite member')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to invite member'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      throw error
    }
  },

  removeMember: async (workspaceId: string, memberId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`)
      
      if (response.success) {
        // Refresh workspace to get updated member list
        await get().fetchWorkspace(workspaceId)
      } else {
        throw new Error(response.error || 'Failed to remove member')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to remove member'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      throw error
    }
  },

  fetchRoles: async () => {
    try {
      const response = await apiClient.get<{ roles: Role[] }>('/workspaces/roles/list')
      
      if (response.success && response.data) {
        set({ roles: response.data.roles })
      }
    } catch (error: any) {
      console.error('Failed to fetch roles:', error)
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))