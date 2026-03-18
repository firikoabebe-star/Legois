import { Router } from 'express';
import * as authController from '@/controllers/auth.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateBody } from '@/middleware/validation.middleware';
import { authLimiter } from '@/middleware/rate-limit.middleware';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema 
} from '@/utils/validation';

const router = Router();

// Public routes with rate limiting
router.post('/register', 
  authLimiter,
  validateBody(registerSchema),
  authController.register
);

router.post('/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

router.post('/refresh',
  authLimiter,
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

// Protected routes
router.get('/me',
  authenticate,
  authController.getCurrentUser
);

router.patch('/profile',
  authenticate,
  authController.updateProfile
);

router.post('/change-password',
  authenticate,
  authController.changePassword
);

router.post('/logout',
  authenticate,
  authController.logout
);

export default router;