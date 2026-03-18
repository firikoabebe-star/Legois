import { Router } from 'express';
import * as workspaceController from '@/controllers/workspace.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateBody, validateParams } from '@/middleware/validation.middleware';
import { contentLimiter } from '@/middleware/rate-limit.middleware';
import { shortCache, mediumCache, staticCache } from '@/middleware/cache.middleware';
import { 
  createWorkspaceSchema, 
  updateWorkspaceSchema,
  inviteMemberSchema 
} from '@/utils/validation';
import { z } from 'zod';

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

// Workspace CRUD
router.get('/',
  shortCache, // Cache for 1 minute
  workspaceController.getUserWorkspaces
);

router.get('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  shortCache, // Cache for 1 minute
  workspaceController.getWorkspaceById
);

router.post('/',
  contentLimiter,
  validateBody(createWorkspaceSchema),
  workspaceController.createWorkspace
);

router.patch('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateWorkspaceSchema),
  workspaceController.updateWorkspace
);

router.delete('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  workspaceController.deleteWorkspace
);

// Member management
router.post('/:id/invite',
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(inviteMemberSchema),
  workspaceController.inviteMember
);

router.delete('/:id/members/:memberId',
  validateParams(z.object({ 
    id: z.string().min(1),
    memberId: z.string().min(1)
  })),
  workspaceController.removeMember
);

// Utility routes
router.get('/roles/list',
  staticCache, // Cache for 24 hours (roles rarely change)
  workspaceController.getRoles
);

export default router;