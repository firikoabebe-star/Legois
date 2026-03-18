// User types
export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// Workspace types
export interface Role {
  id: string
  name: string
  description?: string
  canCreatePages: boolean
  canEditPages: boolean
  canDeletePages: boolean
  canInviteMembers: boolean
  canManageMembers: boolean
  canManageSettings: boolean
}

export interface WorkspaceMember {
  id: string
  userId: string
  workspaceId: string
  roleId: string
  isActive: boolean
  invitedBy?: string
  invitedAt?: string
  joinedAt: string
  user: {
    id: string
    email: string
    username: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
  role: Role
}

export interface Workspace {
  id: string
  name: string
  description?: string
  icon?: string
  domain?: string
  isPublic: boolean
  allowGuests: boolean
  createdAt: string
  updatedAt: string
  creatorId: string
  members: WorkspaceMember[]
  _count: {
    pages: number
    members: number
  }
}

// Page types
export interface Page {
  id: string
  title: string
  icon?: string
  cover?: string
  parentId?: string
  content?: any
  isPublic: boolean
  isTemplate: boolean
  isArchived: boolean
  isFavorite: boolean
  slug?: string
  metaTitle?: string
  metaDescription?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  workspaceId: string
  creatorId: string
  children?: Page[]
}

// Block types
export type BlockType = 
  | 'text'
  | 'heading'
  | 'list'
  | 'checklist'
  | 'image'
  | 'code'
  | 'divider'
  | 'quote'
  | 'callout'
  | 'database'

export interface Block {
  id: string
  type: BlockType
  content: any
  position: number
  parentId?: string
  pageId: string
  creatorId: string
  isArchived: boolean
  createdAt: string
  updatedAt: string
  children?: Block[]
}

// Database types
export type DatabasePropertyType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'person'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by'

export interface DatabaseProperty {
  id: string
  name: string
  type: DatabasePropertyType
  options?: any
  formula?: string
  position: number
  isVisible: boolean
  databaseId: string
}

export interface DatabaseRow {
  id: string
  position: number
  isArchived: boolean
  databaseId: string
  values: DatabaseValue[]
  createdAt: string
  updatedAt: string
}

export interface DatabaseValue {
  id: string
  value: any
  rowId: string
  propertyId: string
}

export interface DatabaseView {
  id: string
  name: string
  type: 'table' | 'board' | 'calendar' | 'gallery' | 'list'
  config: any
  isDefault: boolean
  databaseId: string
}

export interface Database {
  id: string
  name: string
  description?: string
  icon?: string
  defaultView: string
  workspaceId: string
  properties: DatabaseProperty[]
  rows: DatabaseRow[]
  views: DatabaseView[]
  createdAt: string
  updatedAt: string
}

// Comment types
export interface Comment {
  id: string
  content: any
  parentId?: string
  isResolved: boolean
  isEdited: boolean
  createdAt: string
  updatedAt: string
  authorId: string
  pageId?: string
  blockId?: string
  author: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
  replies?: Comment[]
}

// Notification types
export interface Notification {
  id: string
  type: string
  title: string
  message?: string
  data?: any
  isRead: boolean
  readAt?: string
  createdAt: string
  userId: string
  workspaceId?: string
}

// Activity log types
export interface ActivityLog {
  id: string
  action: string
  entity: string
  entityId: string
  details?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
  userId: string
  workspaceId?: string
  pageId?: string
  user: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  username: string
  firstName?: string
  lastName?: string
  password: string
  confirmPassword: string
}

export interface CreateWorkspaceForm {
  name: string
  description?: string
  icon?: string
}

export interface CreatePageForm {
  title: string
  icon?: string
  parentId?: string
  workspaceId: string
}

// UI types
export interface Toast {
  id: string
  title?: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface Modal {
  id: string
  isOpen: boolean
  title?: string
  content?: React.ReactNode
  onClose?: () => void
}

// Navigation types
export interface NavItem {
  id: string
  label: string
  href?: string
  icon?: React.ComponentType<any>
  children?: NavItem[]
  isActive?: boolean
  onClick?: () => void
}