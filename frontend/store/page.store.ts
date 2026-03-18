import { create } from 'zustand'
import { Page, Block, CreatePageForm } from '@/types'
import { apiClient } from '@/lib/api'

interface PageState {
  pages: Page[]
  currentPage: Page | null
  blocks: Block[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchWorkspacePages: (workspaceId: string) => Promise<void>
  fetchPage: (pageId: string) => Promise<void>
  createPage: (data: CreatePageForm) => Promise<Page>
  updatePage: (pageId: string, data: Partial<Page>) => Promise<void>
  deletePage: (pageId: string) => Promise<void>
  duplicatePage: (pageId: string) => Promise<Page>
  setCurrentPage: (page: Page | null) => void
  clearError: () => void
}

export const usePageStore = create<PageState>((set, get) => ({
  pages: [],
  currentPage: null,
  blocks: [],
  isLoading: false,
  error: null,

  fetchWorkspacePages: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get<{ pages: Page[] }>(`/pages/workspace/${workspaceId}`)
      
      if (response.success && response.data) {
        set({ 
          pages: response.data.pages, 
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch pages')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch pages'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
    }
  },

  fetchPage: async (pageId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get<{ page: Page }>(`/pages/${pageId}`)
      
      if (response.success && response.data) {
        const page = response.data.page
        
        // Update page in list if it exists
        const pages = get().pages.map(p => 
          p.id === page.id ? page : p
        )
        
        set({ 
          pages,
          currentPage: page,
          blocks: (page as any).blocks || [],
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch page')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch page'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
    }
  },

  createPage: async (data: CreatePageForm) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.post<{ page: Page }>('/pages', data)
      
      if (response.success && response.data) {
        const newPage = response.data.page
        
        set(state => ({ 
          pages: [newPage, ...state.pages],
          isLoading: false 
        }))
        
        return newPage
      } else {
        throw new Error(response.error || 'Failed to create page')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create page'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      throw error
    }
  },

  updatePage: async (pageId: string, data: Partial<Page>) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.patch<{ page: Page }>(`/pages/${pageId}`, data)
      
      if (response.success && response.data) {
        const updatedPage = response.data.page
        
        set(state => ({
          pages: state.pages.map(p => 
            p.id === pageId ? updatedPage : p
          ),
          currentPage: state.currentPage?.id === pageId ? updatedPage : state.currentPage,
          isLoading: false
        }))
      } else {
        throw new Error(response.error || 'Failed to update page')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update page'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      throw error
    }
  },

  deletePage: async (pageId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.delete(`/pages/${pageId}`)
      
      if (response.success) {
        set(state => ({
          pages: state.pages.filter(p => p.id !== pageId),
          currentPage: state.currentPage?.id === pageId ? null : state.currentPage,
          blocks: state.currentPage?.id === pageId ? [] : state.blocks,
          isLoading: false
        }))
      } else {
        throw new Error(response.error || 'Failed to delete page')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete page'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      throw error
    }
  },

  duplicatePage: async (pageId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.post<{ page: Page }>(`/pages/${pageId}/duplicate`)
      
      if (response.success && response.data) {
        const duplicatedPage = response.data.page
        
        set(state => ({
          pages: [duplicatedPage, ...state.pages],
          isLoading: false
        }))
        
        return duplicatedPage
      } else {
        throw new Error(response.error || 'Failed to duplicate page')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to duplicate page'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      throw error
    }
  },

  setCurrentPage: (page: Page | null) => {
    set({ 
      currentPage: page,
      blocks: (page as any)?.blocks || []
    })
  },

  clearError: () => {
    set({ error: null })
  },
}))