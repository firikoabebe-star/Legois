import { create } from 'zustand'
import { Comment } from '@/types'
import { apiClient } from '@/lib/api'

interface CreateCommentData {
  content: any
  pageId?: string
  blockId?: string
  parentId?: string
}

interface UpdateCommentData {
  content?: any
  isResolved?: boolean
}

interface CommentState {
  comments: Comment[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchPageComments: (pageId: string) => Promise<void>
  fetchBlockComments: (blockId: string) => Promise<void>
  createComment: (data: CreateCommentData) => Promise<Comment>
  updateComment: (commentId: string, data: UpdateCommentData) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  resolveComment: (commentId: string) => Promise<void>
  clearComments: () => void
  clearError: () => void
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  isLoading: false,
  error: null,

  fetchPageComments: async (pageId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get<{ comments: Comment[] }>(`/comments/page/${pageId}`)
      
      if (response.success && response.data) {
        set({ 
          comments: response.data.comments, 
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch comments')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch comments'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
    }
  },

  fetchBlockComments: async (blockId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get<{ comments: Comment[] }>(`/comments/block/${blockId}`)
      
      if (response.success && response.data) {
        set({ 
          comments: response.data.comments, 
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch comments')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch comments'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
    }
  },

  createComment: async (data: CreateCommentData) => {
    try {
      const response = await apiClient.post<{ comment: Comment }>('/comments', data)
      
      if (response.success && response.data) {
        const newComment = response.data.comment
        
        set(state => ({
          comments: [newComment, ...state.comments]
        }))
        
        return newComment
      } else {
        throw new Error(response.error || 'Failed to create comment')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create comment'
      set({ error: errorMessage })
      throw error
    }
  },

  updateComment: async (commentId: string, data: UpdateCommentData) => {
    try {
      const response = await apiClient.patch<{ comment: Comment }>(`/comments/${commentId}`, data)
      
      if (response.success && response.data) {
        const updatedComment = response.data.comment
        
        set(state => ({
          comments: state.comments.map(comment => 
            comment.id === commentId ? updatedComment : comment
          )
        }))
      } else {
        throw new Error(response.error || 'Failed to update comment')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update comment'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      const response = await apiClient.delete(`/comments/${commentId}`)
      
      if (response.success) {
        set(state => ({
          comments: state.comments.filter(comment => comment.id !== commentId)
        }))
      } else {
        throw new Error(response.error || 'Failed to delete comment')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete comment'
      set({ error: errorMessage })
      throw error
    }
  },

  resolveComment: async (commentId: string) => {
    try {
      const response = await apiClient.post<{ comment: Comment }>(`/comments/${commentId}/resolve`)
      
      if (response.success && response.data) {
        const resolvedComment = response.data.comment
        
        set(state => ({
          comments: state.comments.map(comment => 
            comment.id === commentId ? resolvedComment : comment
          )
        }))
      } else {
        throw new Error(response.error || 'Failed to resolve comment')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to resolve comment'
      set({ error: errorMessage })
      throw error
    }
  },

  clearComments: () => {
    set({ comments: [] })
  },

  clearError: () => {
    set({ error: null })
  },
}))