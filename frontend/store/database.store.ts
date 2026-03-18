import { create } from 'zustand'
import { Database, DatabaseProperty, DatabaseRow, DatabaseView } from '@/types'
import { apiClient } from '@/lib/api'

interface CreateDatabaseData {
  name: string
  description?: string
  icon?: string
  workspaceId: string
}

interface CreatePropertyData {
  name: string
  type: string
  options?: any
  formula?: string
  databaseId: string
}

interface CreateRowData {
  databaseId: string
  values: Record<string, any>
}

interface CreateViewData {
  name: string
  type: 'table' | 'board' | 'calendar' | 'gallery' | 'list'
  config: any
  databaseId: string
  isDefault?: boolean
}

interface DatabaseState {
  databases: Database[]
  currentDatabase: Database | null
  currentView: DatabaseView | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchWorkspaceDatabases: (workspaceId: string) => Promise<void>
  fetchDatabase: (databaseId: string) => Promise<void>
  createDatabase: (data: CreateDatabaseData) => Promise<Database>
  updateDatabase: (databaseId: string, data: Partial<Database>) => Promise<void>
  deleteDatabase: (databaseId: string) => Promise<void>
  
  // Property actions
  createProperty: (data: CreatePropertyData) => Promise<DatabaseProperty>
  
  // Row actions
  createRow: (data: CreateRowData) => Promise<DatabaseRow>
  updateRowValue: (rowId: string, propertyId: string, value: any) => Promise<void>
  deleteRow: (rowId: string) => Promise<void>
  
  // View actions
  createView: (data: CreateViewData) => Promise<DatabaseView>
  setCurrentView: (view: DatabaseView | null) => void
  
  // Utility actions
  setCurrentDatabase: (database: Database | null) => void
  clearError: () => void
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  databases: [],
  currentDatabase: null,
  currentView: null,
  isLoading: false,
  error: null,

  fetchWorkspaceDatabases: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get<{ databases: Database[] }>(`/databases/workspace/${workspaceId}`)
      
      if (response.success && response.data) {
        set({ 
          databases: response.data.databases, 
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch databases')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch databases'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
    }
  },

  fetchDatabase: async (databaseId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get<{ database: Database }>(`/databases/${databaseId}`)
      
      if (response.success && response.data) {
        const database = response.data.database
        
        // Update database in list if it exists
        const databases = get().databases.map(d => 
          d.id === database.id ? database : d
        )
        
        // Set default view if none selected
        const defaultView = (database as any).views?.find((v: DatabaseView) => v.isDefault) || (database as any).views?.[0] || null
        
        set({ 
          databases,
          currentDatabase: database,
          currentView: defaultView,
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'Failed to fetch database')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch database'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
    }
  },

  createDatabase: async (data: CreateDatabaseData) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.post<{ database: Database }>('/databases', data)
      
      if (response.success && response.data) {
        const newDatabase = response.data.database
        
        set(state => ({ 
          databases: [newDatabase, ...state.databases],
          isLoading: false 
        }))
        
        return newDatabase
      } else {
        throw new Error(response.error || 'Failed to create database')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create database'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      throw error
    }
  },

  updateDatabase: async (databaseId: string, data: Partial<Database>) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.patch<{ database: Database }>(`/databases/${databaseId}`, data)
      
      if (response.success && response.data) {
        const updatedDatabase = response.data.database
        
        set(state => ({
          databases: state.databases.map(d => 
            d.id === databaseId ? updatedDatabase : d
          ),
          currentDatabase: state.currentDatabase?.id === databaseId ? updatedDatabase : state.currentDatabase,
          isLoading: false
        }))
      } else {
        throw new Error(response.error || 'Failed to update database')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update database'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      throw error
    }
  },

  deleteDatabase: async (databaseId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.delete(`/databases/${databaseId}`)
      
      if (response.success) {
        set(state => ({
          databases: state.databases.filter(d => d.id !== databaseId),
          currentDatabase: state.currentDatabase?.id === databaseId ? null : state.currentDatabase,
          currentView: state.currentDatabase?.id === databaseId ? null : state.currentView,
          isLoading: false
        }))
      } else {
        throw new Error(response.error || 'Failed to delete database')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete database'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      throw error
    }
  },

  createProperty: async (data: CreatePropertyData) => {
    try {
      const response = await apiClient.post<{ property: DatabaseProperty }>('/databases/properties', data)
      
      if (response.success && response.data) {
        const newProperty = response.data.property
        
        // Refresh the current database to get updated properties
        if (get().currentDatabase?.id === data.databaseId) {
          await get().fetchDatabase(data.databaseId)
        }
        
        return newProperty
      } else {
        throw new Error(response.error || 'Failed to create property')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create property'
      set({ error: errorMessage })
      throw error
    }
  },

  createRow: async (data: CreateRowData) => {
    try {
      const response = await apiClient.post<{ row: DatabaseRow }>('/databases/rows', data)
      
      if (response.success && response.data) {
        const newRow = response.data.row
        
        // Refresh the current database to get updated rows
        if (get().currentDatabase?.id === data.databaseId) {
          await get().fetchDatabase(data.databaseId)
        }
        
        return newRow
      } else {
        throw new Error(response.error || 'Failed to create row')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create row'
      set({ error: errorMessage })
      throw error
    }
  },

  updateRowValue: async (rowId: string, propertyId: string, value: any) => {
    try {
      const response = await apiClient.patch(`/databases/rows/${rowId}/values/${propertyId}`, { value })
      
      if (response.success) {
        // Optimistically update the current database
        const currentDatabase = get().currentDatabase
        if (currentDatabase) {
          const updatedDatabase = {
            ...currentDatabase,
            rows: (currentDatabase as any).rows?.map((row: any) => {
              if (row.id === rowId) {
                return {
                  ...row,
                  values: row.values.map((val: any) => 
                    val.propertyId === propertyId 
                      ? { ...val, value: { [getValueKey(val.property.type)]: value } }
                      : val
                  )
                }
              }
              return row
            })
          }
          
          set({ currentDatabase: updatedDatabase })
        }
      } else {
        throw new Error(response.error || 'Failed to update row value')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update row value'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteRow: async (rowId: string) => {
    try {
      const response = await apiClient.delete(`/databases/rows/${rowId}`)
      
      if (response.success) {
        // Optimistically update the current database
        const currentDatabase = get().currentDatabase
        if (currentDatabase) {
          const updatedDatabase = {
            ...currentDatabase,
            rows: (currentDatabase as any).rows?.filter((row: any) => row.id !== rowId)
          }
          
          set({ currentDatabase: updatedDatabase })
        }
      } else {
        throw new Error(response.error || 'Failed to delete row')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete row'
      set({ error: errorMessage })
      throw error
    }
  },

  createView: async (data: CreateViewData) => {
    try {
      const response = await apiClient.post<{ view: DatabaseView }>('/databases/views', data)
      
      if (response.success && response.data) {
        const newView = response.data.view
        
        // Refresh the current database to get updated views
        if (get().currentDatabase?.id === data.databaseId) {
          await get().fetchDatabase(data.databaseId)
        }
        
        return newView
      } else {
        throw new Error(response.error || 'Failed to create view')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create view'
      set({ error: errorMessage })
      throw error
    }
  },

  setCurrentView: (view: DatabaseView | null) => {
    set({ currentView: view })
  },

  setCurrentDatabase: (database: Database | null) => {
    set({ 
      currentDatabase: database,
      currentView: database ? (database as any).views?.find((v: DatabaseView) => v.isDefault) || (database as any).views?.[0] || null : null
    })
  },

  clearError: () => {
    set({ error: null })
  },
}))

// Helper function to get the correct value key based on property type
function getValueKey(propertyType: string): string {
  switch (propertyType) {
    case 'number':
      return 'number'
    case 'checkbox':
      return 'checked'
    case 'date':
      return 'date'
    case 'select':
      return 'select'
    case 'multi_select':
      return 'multi_select'
    default:
      return 'text'
  }
}