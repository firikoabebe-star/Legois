import { Router } from 'express';
import * as notificationController from '@/controllers/notification.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateParams, validateQuery } from '@/middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get notifications
router.get('/',
  validateQuery(z.object({ limit: z.string().optional() })),
  notificationController.getUserNotifications
);

router.get('/unread-count',
  notificationController.getUnreadCount
);

// Mark as read
router.patch('/:id/read',
  validateParams(z.object({ id: z.string().min(1) })),
  notificationController.markAsRead
);

router.patch('/read-all',
  notificationController.markAllAsRead
);

// Delete notification
router.delete('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  notificationController.deleteNotification
);

export default router;