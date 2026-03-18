import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import prisma from '@/config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = verifyAccessToken(token);
      
      // Verify user still exists and is active
      const user = await prisma.user.findFirst({
        where: {
          id: payload.userId,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          username: true,
          emailVerified: true,
        },
      });

      if (!user) {
        res.status(401).json({ error: 'User not found or inactive' });
        return;
      }

      if (!user.emailVerified) {
        res.status(401).json({ error: 'Email not verified' });
        return;
      }

      req.user = {
        userId: user.id,
        email: user.email,
        username: user.username,
      };

      next();
    } catch (jwtError) {
      logger.warn('Invalid JWT token', { 
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    logger.error('Authentication middleware error', error as Error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (user) {
      req.user = {
        userId: user.id,
        email: user.email,
        username: user.username,
      };
    }
  } catch (error) {
    // Ignore auth errors for optional auth
    logger.debug('Optional auth failed', { error: (error as Error).message });
  }

  next();
};