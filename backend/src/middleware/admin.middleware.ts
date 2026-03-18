import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { ApiError } from './error.middleware';
import prisma from '@/config/database';
import { logger } from '@/utils/logger';

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    // Check if user is admin (for now, we'll use email-based admin check)
    // In production, you'd want a proper admin role system
    const user = await prisma.user.findFirst({
      where: {
        id: req.user.userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // For demo purposes, make the demo user an admin
    // In production, you'd check against an admin role or specific admin table
    const isAdmin = user.email === 'demo@example.com' || 
                   user.email.endsWith('@admin.com') ||
                   process.env.ADMIN_EMAILS?.split(',').includes(user.email);

    if (!isAdmin) {
      logger.warn('Admin access denied', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      throw new ApiError('Admin access required', 403);
    }

    // Add admin flag to request
    req.user.isAdmin = true;
    
    logger.info('Admin access granted', {
      userId: user.id,
      email: user.email,
      endpoint: req.path,
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Extend the AuthenticatedRequest interface
declare module './auth.middleware' {
  interface AuthenticatedRequest {
    user?: {
      userId: string;
      email: string;
      isAdmin?: boolean;
    };
  }
}