import { Response } from 'express';
import { AdminService } from '@/services/admin.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const adminService = new AdminService();

export const getSystemStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await adminService.getSystemStats();
  
  res.json({
    success: true,
    data: { stats },
  });
});

export const getAllUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const result = await adminService.getAllUsers(page, limit, search);
  
  res.json({
    success: true,
    data: result,
  });
});

export const getAllWorkspaces = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const result = await adminService.getAllWorkspaces(page, limit, search);
  
  res.json({
    success: true,
    data: result,
  });
});

export const getRecentActivity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  
  const activities = await adminService.getRecentActivity(limit);
  
  res.json({
    success: true,
    data: { activities },
  });
});

export const suspendUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  
  await adminService.suspendUser(userId, req.user!.userId);
  
  res.json({
    success: true,
    message: 'User suspended successfully',
  });
});

export const reactivateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  
  await adminService.reactivateUser(userId, req.user!.userId);
  
  res.json({
    success: true,
    message: 'User reactivated successfully',
  });
});

export const deleteWorkspace = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { workspaceId } = req.params;
  
  await adminService.deleteWorkspace(workspaceId, req.user!.userId);
  
  res.json({
    success: true,
    message: 'Workspace deleted successfully',
  });
});

export const getGrowthMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const metrics = await adminService.getGrowthMetrics();
  
  res.json({
    success: true,
    data: { metrics },
  });
});