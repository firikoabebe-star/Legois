import { create } from 'zustand'
import { Block, BlockType } from '@/types'
import { apiClient } from '@/lib/api'

interface CreateBlockData {
  type: BlockType
  content: any
  position: number
  parentId?: string
  pageId: string
}

interface UpdateBlockData {
  type?: BlockType
  content?: any
  position?: number
  parentId?: string
}

interface MoveBlockData {
  position: number
  parentId?: string
}

interface BlockState {
  blocks: Block[]
  selectedBlockId: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchPageBlocks: (pageId: string) => Promise<void>
  createBlock: (data: CreateBlockData) => Promise<Block>
  updateBlock: (blockId: string, data: UpdateBlockData) => Promise<void>
  deleteBlock: (blockId: string) => Promise<void>
  moveBlock: (blockId: string, data: MoveBlockData) => Promise<void>
  duplicateBlock: (blockId: string) => Promise<Block>
  setSelectedBlock: (blockId: string | null) => void
  setBlocks: (blocks: Block[]) => void
  clearError: () => void
}

export const useBlockStore = create<BlockState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  isLoading: false,
  error: null,

  fetchPageBlocks: async (pageId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get<{ blocks: Block[] }>(`/blocks/page/${pageId}`)
      
      if (response.success && response.data) {
        set({ 
          blocks: response.data.blocks, 
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch blocks')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch blocks'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
    }
  },

  createBlock: async (data: CreateBlockData) => {
    try {
      const response = await apiClient.post<{ block: Block }>('/blocks', data)
      
      if (response.success && response.data) {
        const newBlock = response.data.block
        
        set(state => {
          const blocks = [...state.blocks]
          // Insert block at the correct position
          blocks.splice(data.position, 0, newBlock)
          // Update positions of subsequent blocks
          for (let i = data.position + 1; i < blocks.length; i++) {
            blocks[i] = { ...blocks[i], position: i }
          }
          return { blocks }
        })
        
        return newBlock
      } else {
        throw new Error(response.error || 'Failed to create block')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create block'
      set({ error: errorMessage })
      throw error
    }
  },

  updateBlock: async (blockId: string, data: UpdateBlockData) => {
    try {
      const response = await apiClient.patch<{ block: Block }>(`/blocks/${blockId}`, data)
      
      if (response.success && response.data) {
        const updatedBlock = response.data.block
        
        set(state => ({
          blocks: state.blocks.map(block => 
            block.id === blockId ? updatedBlock : block
          )
        }))
      } else {
        throw new Error(response.error || 'Failed to update block')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update block'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteBlock: async (blockId: string) => {
    try {
      const response = await apiClient.delete(`/blocks/${blockId}`)
      
      if (response.success) {
        set(state => {
          const blocks = state.blocks.filter(block => block.id !== blockId)
          // Update positions after deletion
          return {
            blocks: blocks.map((block, index) => ({ ...block, position: index })),
            selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId
          }
        })
      } else {
        throw new Error(response.error || 'Failed to delete block')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete block'
      set({ error: errorMessage })
      throw error
    }
  },

  moveBlock: async (blockId: string, data: MoveBlockData) => {
    try {
      const response = await apiClient.post<{ block: Block }>(`/blocks/${blockId}/move`, data)
      
      if (response.success && response.data) {
        const movedBlock = response.data.block
        
        set(state => {
          const blocks = [...state.blocks]
          const oldIndex = blocks.findIndex(b => b.id === blockId)
          const newIndex = data.position
          
          if (oldIndex !== -1) {
            // Remove block from old position
            const [block] = blocks.splice(oldIndex, 1)
            // Insert at new position
            blocks.splice(newIndex, 0, { ...block, ...movedBlock })
            
            // Update all positions
            return {
              blocks: blocks.map((block, index) => ({ ...block, position: index }))
            }
          }
          
          return state
        })
      } else {
        throw new Error(response.error || 'Failed to move block')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to move block'
      set({ error: errorMessage })
      throw error
    }
  },

  duplicateBlock: async (blockId: string) => {
    try {
      const response = await apiClient.post<{ block: Block }>(`/blocks/${blockId}/duplicate`)
      
      if (response.success && response.data) {
        const duplicatedBlock = response.data.block
        
        set(state => {
          const blocks = [...state.blocks]
          const originalIndex = blocks.findIndex(b => b.id === blockId)
          
          if (originalIndex !== -1) {
            // Insert duplicated block after original
            blocks.splice(originalIndex + 1, 0, duplicatedBlock)
            // Update positions
            return {
              blocks: blocks.map((block, index) => ({ ...block, position: index }))
            }
          }
          
          return { blocks: [...blocks, duplicatedBlock] }
        })
        
        return duplicatedBlock
      } else {
        throw new Error(response.error || 'Failed to duplicate block')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to duplicate block'
      set({ error: errorMessage })
      throw error
    }
  },

  setSelectedBlock: (blockId: string | null) => {
    set({ selectedBlockId: blockId })
  },

  setBlocks: (blocks: Block[]) => {
    set({ blocks })
  },

  clearError: () => {
    set({ error: null })
  },
}))