import { Router } from 'express';
import * as commentController from '@/controllers/comment.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateBody, validateParams } from '@/middleware/validation.middleware';
import { contentLimiter } from '@/middleware/rate-limit.middleware';
import { createCommentSchema, updateCommentSchema } from '@/utils/validation';
import { z } from 'zod';

const router = Router();

// All comment routes require authentication
router.use(authenticate);

// Get comments
router.get('/page/:pageId',
  validateParams(z.object({ pageId: z.string().min(1) })),
  commentController.getPageComments
);

router.get('/block/:blockId',
  validateParams(z.object({ blockId: z.string().min(1) })),
  commentController.getBlockComments
);

// Comment CRUD
router.post('/',
  contentLimiter,
  validateBody(createCommentSchema),
  commentController.createComment
);

router.patch('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateCommentSchema),
  commentController.updateComment
);

router.delete('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  commentController.deleteComment
);

router.post('/:id/resolve',
  validateParams(z.object({ id: z.string().min(1) })),
  commentController.resolveComment
);

export default router;