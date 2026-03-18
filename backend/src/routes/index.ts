import { Router } from 'express';
import authRoutes from './auth.routes';
import workspaceRoutes from './workspace.routes';
import pageRoutes from './page.routes';
import blockRoutes from './block.routes';
import databaseRoutes from './database.routes';
import commentRoutes from './comment.routes';
import activityRoutes from './activity.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import securityRoutes from './security.routes';
import performanceRoutes from './performance.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/pages', pageRoutes);
router.use('/blocks', blockRoutes);
router.use('/databases', databaseRoutes);
router.use('/comments', commentRoutes);
router.use('/activity', activityRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/security', securityRoutes);
router.use('/performance', performanceRoutes);

export default router;