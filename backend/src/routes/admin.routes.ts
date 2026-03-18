import { Router } from 'express';
import * as adminController from '@/controllers/admin.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requireAdmin } from '@/middleware/admin.middleware';
import { validateParams } from '@/middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

// System statistics
router.get('/stats', adminController.getSystemStats);

// Growth metrics
router.get('/metrics/growth', adminController.getGrowthMetrics);

// User management
router.get('/users', adminController.getAllUsers);
router.post('/users/:userId/suspend',
  validateParams(z.object({ userId: z.string().min(1) })),
  adminController.suspendUser
);
router.post('/users/:userId/reactivate',
  validateParams(z.object({ userId: z.string().min(1) })),
  adminController.reactivateUser
);

// Workspace management
router.get('/workspaces', adminController.getAllWorkspaces);
router.delete('/workspaces/:workspaceId',
  validateParams(z.object({ workspaceId: z.string().min(1) })),
  adminController.deleteWorkspace
);

// Activity monitoring
router.get('/activity', adminController.getRecentActivity);

export default router;