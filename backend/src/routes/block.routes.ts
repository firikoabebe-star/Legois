import { Router } from 'express';
import * as blockController from '@/controllers/block.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateBody, validateParams } from '@/middleware/validation.middleware';
import { contentLimiter } from '@/middleware/rate-limit.middleware';
import { 
  createBlockSchema, 
  updateBlockSchema 
} from '@/utils/validation';
import { z } from 'zod';

const router = Router();

// All block routes require authentication
router.use(authenticate);

// Block CRUD
router.get('/page/:pageId',
  validateParams(z.object({ pageId: z.string().min(1) })),
  blockController.getPageBlocks
);

router.post('/',
  contentLimiter,
  validateBody(createBlockSchema),
  blockController.createBlock
);

router.patch('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateBlockSchema),
  blockController.updateBlock
);

router.delete('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  blockController.deleteBlock
);

router.post('/:id/move',
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(z.object({
    position: z.number().int().min(0),
    parentId: z.string().optional(),
  })),
  blockController.moveBlock
);

router.post('/:id/duplicate',
  validateParams(z.object({ id: z.string().min(1) })),
  blockController.duplicateBlock
);

export default router;