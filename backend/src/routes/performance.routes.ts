import { Router } from 'express';
import * as performanceController from '@/controllers/performance.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requireAdmin } from '@/middleware/admin.middleware';
import { validateBody } from '@/middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// All performance routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

// Performance analytics
router.get('/analytics', performanceController.getPerformanceAnalytics);
router.get('/metrics/system', performanceController.getSystemMetrics);
router.get('/recommendations', performanceController.getPerformanceRecommendations);
router.get('/optimization-suggestions', performanceController.getOptimizationSuggestions);

// Cache management
router.get('/cache/stats', performanceController.getCacheStats);
router.post('/cache/clear',
  validateBody(z.object({
    prefix: z.string().optional(),
  })),
  performanceController.clearCache
);
router.post('/cache/warmup',
  validateBody(z.object({
    keys: z.array(z.string()),
  })),
  performanceController.warmUpCache
);

// Database performance
router.get('/database', performanceController.getDatabasePerformance);

// Memory analysis
router.get('/memory', performanceController.getMemoryAnalysis);

// Export metrics
router.get('/export', performanceController.exportMetrics);

export default router;