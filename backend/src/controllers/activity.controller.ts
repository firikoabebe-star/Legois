import { Response } from 'express';
import { ActivityService } from '@/services/activity.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const activityService = new ActivityService();

export const getWorkspaceActivity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { workspaceId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;
  
  const activities = await activityService.getWorkspaceActivity(workspaceId, req.user!.userId, limit);
  
  res.json({
    success: true,
    data: { activities },
  });
});

export const getPageActivity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { pageId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;
  
  const activities = await activityService.getPageActivity(pageId, req.user!.userId, limit);
  
  res.json({
    success: true,
    data: { activities },
  });
});

export const getUserActivity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  
  const activities = await activityService.getUserActivity(req.user!.userId, limit);
  
  res.json({
    success: true,
    data: { activities },
  });
});

export const getActivityStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { workspaceId } = req.params;
  
  const stats = await activityService.getActivityStats(workspaceId, req.user!.userId);
  
  res.json({
    success: true,
    data: { stats },
  });
});