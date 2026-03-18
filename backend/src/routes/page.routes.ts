import { Router } from 'express';
import * as pageController from '@/controllers/page.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateBody, validateParams } from '@/middleware/validation.middleware';
import { contentLimiter } from '@/middleware/rate-limit.middleware';
import { 
  createPageSchema, 
  updatePageSchema 
} from '@/utils/validation';
import { z } from 'zod';

const router = Router();

// All page routes require authentication
router.use(authenticate);

// Page CRUD
router.get('/workspace/:workspaceId',
  validateParams(z.object({ workspaceId: z.string().min(1) })),
  pageController.getWorkspacePages
);

router.get('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  pageController.getPageById
);

router.post('/',
  contentLimiter,
  validateBody(createPageSchema),
  pageController.createPage
);

router.patch('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updatePageSchema),
  pageController.updatePage
);

router.delete('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  pageController.deletePage
);

router.post('/:id/duplicate',
  validateParams(z.object({ id: z.string().min(1) })),
  pageController.duplicatePage
);

export default router;