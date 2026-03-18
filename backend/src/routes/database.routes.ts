import { Router } from 'express';
import * as databaseController from '@/controllers/database.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateBody, validateParams } from '@/middleware/validation.middleware';
import { contentLimiter } from '@/middleware/rate-limit.middleware';
import { z } from 'zod';

const router = Router();

// All database routes require authentication
router.use(authenticate);

// Database CRUD
router.get('/workspace/:workspaceId',
  validateParams(z.object({ workspaceId: z.string().min(1) })),
  databaseController.getWorkspaceDatabases
);

router.get('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  databaseController.getDatabaseById
);

router.post('/',
  contentLimiter,
  validateBody(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    icon: z.string().optional(),
    workspaceId: z.string().min(1),
  })),
  databaseController.createDatabase
);

router.patch('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    icon: z.string().optional(),
    defaultView: z.string().optional(),
  })),
  databaseController.updateDatabase
);

router.delete('/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  databaseController.deleteDatabase
);

// Property management
router.post('/properties',
  contentLimiter,
  validateBody(z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['text', 'number', 'select', 'multi_select', 'date', 'person', 'checkbox', 'url', 'email', 'phone', 'formula', 'relation', 'rollup', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by']),
    options: z.any().optional(),
    formula: z.string().optional(),
    databaseId: z.string().min(1),
  })),
  databaseController.createProperty
);

// Row management
router.post('/rows',
  contentLimiter,
  validateBody(z.object({
    databaseId: z.string().min(1),
    values: z.record(z.any()),
  })),
  databaseController.createRow
);

router.patch('/rows/:rowId/values/:propertyId',
  validateParams(z.object({ 
    rowId: z.string().min(1),
    propertyId: z.string().min(1)
  })),
  validateBody(z.object({
    value: z.any(),
  })),
  databaseController.updateRowValue
);

router.delete('/rows/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  databaseController.deleteRow
);

// View management
router.post('/views',
  contentLimiter,
  validateBody(z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['table', 'board', 'calendar', 'gallery', 'list']),
    config: z.any(),
    databaseId: z.string().min(1),
    isDefault: z.boolean().optional(),
  })),
  databaseController.createView
);

export default router;