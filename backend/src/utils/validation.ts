import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Workspace validation schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Workspace name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  icon: z.string().optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Workspace name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  icon: z.string().optional(),
  isPublic: z.boolean().optional(),
  allowGuests: z.boolean().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  roleId: z.string().min(1, 'Role is required'),
});

// Page validation schemas
export const createPageSchema = z.object({
  title: z.string().min(1, 'Page title is required').max(200, 'Page title must be less than 200 characters'),
  icon: z.string().optional(),
  cover: z.string().optional(),
  parentId: z.string().optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  content: z.any().optional(),
});

export const updatePageSchema = z.object({
  title: z.string().min(1, 'Page title is required').max(200, 'Page title must be less than 200 characters').optional(),
  icon: z.string().optional(),
  cover: z.string().optional(),
  parentId: z.string().optional(),
  content: z.any().optional(),
  isPublic: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
});

// Block validation schemas
export const createBlockSchema = z.object({
  type: z.string().min(1, 'Block type is required'),
  content: z.any(),
  position: z.number().int().min(0),
  parentId: z.string().optional(),
  pageId: z.string().min(1, 'Page ID is required'),
});

export const updateBlockSchema = z.object({
  type: z.string().min(1, 'Block type is required').optional(),
  content: z.any().optional(),
  position: z.number().int().min(0).optional(),
  parentId: z.string().optional(),
});

// Comment validation schemas
export const createCommentSchema = z.object({
  content: z.any(),
  pageId: z.string().optional(),
  blockId: z.string().optional(),
  parentId: z.string().optional(),
}).refine(data => data.pageId || data.blockId, {
  message: 'Either pageId or blockId must be provided',
});

export const updateCommentSchema = z.object({
  content: z.any(),
  isResolved: z.boolean().optional(),
});