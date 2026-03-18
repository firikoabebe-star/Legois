import { Response } from 'express';
import { NotificationService } from '@/services/notification.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const notificationService = new NotificationService();

export const getUserNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  
  const notifications = await notificationService.getUserNotifications(req.user!.userId, limit);
  
  res.json({
    success: true,
    data: { notifications },
  });
});

export const getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const count = await notificationService.getUnreadCount(req.user!.userId);
  
  res.json({
    success: true,
    data: { count },
  });
});

export const markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const notification = await notificationService.markAsRead(id, req.user!.userId);
  
  res.json({
    success: true,
    message: 'Notification marked as read',
    data: { notification },
  });
});

export const markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await notificationService.markAllAsRead(req.user!.userId);
  
  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});

export const deleteNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await notificationService.deleteNotification(id, req.user!.userId);
  
  res.json({
    success: true,
    message: 'Notification deleted successfully',
  });
});