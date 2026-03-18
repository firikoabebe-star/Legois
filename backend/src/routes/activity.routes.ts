import { Router } from 'express';
import * as activityController from '@/controllers/activity.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateParams, validateQuery } from '@/middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// All activity routes require authentication
router.use(authenticate);

// Get activity feeds
router.get('/workspace/:workspaceId',
  validateParams(z.object({ workspaceId: z.string().min(1) })),
  validateQuery(z.object({ limit: z.string().optional() })),
  activityController.getWorkspaceActivity
);

router.get('/page/:pageId',
  validateParams(z.object({ pageId: z.string().min(1) })),
  validateQuery(z.object({ limit: z.string().optional() })),
  activityController.getPageActivity
);

router.get('/user',
  validateQuery(z.object({ limit: z.string().optional() })),
  activityController.getUserActivity
);

router.get('/workspace/:workspaceId/stats',
  validateParams(z.object({ workspaceId: z.string().min(1) })),
  activityController.getActivityStats
);

export default router;