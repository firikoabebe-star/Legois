import { Response } from 'express';
import { WorkspaceService } from '@/services/workspace.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const workspaceService = new WorkspaceService();

export const getUserWorkspaces = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const workspaces = await workspaceService.getUserWorkspaces(req.user!.userId);
  
  res.json({
    success: true,
    data: { workspaces },
  });
});

export const getWorkspaceById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const workspace = await workspaceService.getWorkspaceById(id, req.user!.userId);
  
  res.json({
    success: true,
    data: { workspace },
  });
});

export const createWorkspace = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const workspace = await workspaceService.createWorkspace(req.user!.userId, req.body);
  
  res.status(201).json({
    success: true,
    message: 'Workspace created successfully',
    data: { workspace },
  });
});

export const updateWorkspace = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const workspace = await workspaceService.updateWorkspace(id, req.user!.userId, req.body);
  
  res.json({
    success: true,
    message: 'Workspace updated successfully',
    data: { workspace },
  });
});

export const deleteWorkspace = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await workspaceService.deleteWorkspace(id, req.user!.userId);
  
  res.json({
    success: true,
    message: 'Workspace deleted successfully',
  });
});

export const inviteMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { email, roleId } = req.body;
  
  await workspaceService.inviteMember(id, req.user!.userId, email, roleId);
  
  res.json({
    success: true,
    message: 'Member invited successfully',
  });
});

export const removeMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id, memberId } = req.params;
  
  await workspaceService.removeMember(id, req.user!.userId, memberId);
  
  res.json({
    success: true,
    message: 'Member removed successfully',
  });
});

export const getRoles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const roles = await workspaceService.getRoles();
  
  res.json({
    success: true,
    data: { roles },
  });
});