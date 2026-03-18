import { Router } from 'express';
import * as securityController from '@/controllers/security.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requireAdmin } from '@/middleware/admin.middleware';
import { validateBody, validateParams } from '@/middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// All security routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

// Security audit and reporting
router.get('/audit/report', securityController.getSecurityAuditReport);
router.get('/compliance/report', securityController.getComplianceReport);
router.get('/events', securityController.getSecurityEvents);
router.get('/analytics', securityController.getSecurityAnalytics);

// Login attempt monitoring
router.get('/login-attempts', securityController.getLoginAttempts);

// Session management
router.get('/sessions', securityController.getUserSessions);
router.delete('/sessions/:sessionId', 
  validateParams(z.object({ sessionId: z.string().min(1) })),
  securityController.invalidateSession
);
router.delete('/sessions/others', securityController.invalidateAllOtherSessions);

// Security actions
router.post('/block-ip',
  validateBody(z.object({
    ip: z.string().min(1),
    reason: z.string().min(1),
    duration: z.number().optional(),
  })),
  securityController.blockIP
);

router.post('/suspend-user',
  validateBody(z.object({
    userId: z.string().min(1),
    reason: z.string().min(1),
  })),
  securityController.suspendUser
);

// Security configuration
router.get('/config', securityController.getSecurityConfig);
router.put('/config',
  validateBody(z.object({
    config: z.object({}).passthrough(),
  })),
  securityController.updateSecurityConfig
);
router.get('/config/export', securityController.exportSecurityConfig);
router.post('/config/import',
  validateBody(z.object({
    configJson: z.string().min(1),
  })),
  securityController.importSecurityConfig
);
router.post('/config/reset', securityController.resetSecurityConfig);

export default router;