import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '@/config/database';
import { ApiError } from './error.middleware';
import { AuthAdvancedService } from '@/services/auth-advanced.service';
import { securityEventStore, SecurityEventType } from './security-advanced.middleware';
import { logger } from '@/utils/logger';

const authAdvancedService = new AuthAdvancedService();

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    sessionId: string;
    isAdmin?: boolean;
  };
}

// Enhanced authentication middleware with session validation
export const authenticateEnhanced = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Authentication required', 401);
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new ApiError('Authentication token required', 401);
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (jwtError: any) {
      // Log invalid token attempts
      securityEventStore.addEvent({
        type: SecurityEventType.INVALID_TOKEN,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        details: { 
          error: jwtError.message,
          token: token.substring(0, 20) + '...',
          url: req.originalUrl,
        },
        timestamp: new Date(),
        severity: 'medium',
      });

      if (jwtError.name === 'TokenExpiredError') {
        throw new ApiError('Token expired', 401);
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new ApiError('Invalid token', 401);
      } else {
        throw new ApiError('Token verification failed', 401);
      }
    }

    // Validate token structure
    if (!decoded.userId || !decoded.sessionId || decoded.type !== 'access') {
      throw new ApiError('Invalid token format', 401);
    }

    // Validate session
    const isValidSession = await authAdvancedService.validateSession(
      decoded.sessionId,
      decoded.userId
    );

    if (!isValidSession) {
      securityEventStore.addEvent({
        type: SecurityEventType.INVALID_TOKEN,
        userId: decoded.userId,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        details: { 
          reason: 'invalid_session',
          sessionId: decoded.sessionId,
          url: req.originalUrl,
        },
        timestamp: new Date(),
        severity: 'high',
      });

      throw new ApiError('Session expired or invalid', 401);
    }

    // Set user information
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    logger.error('Authentication error', error as Error, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
    });

    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

// Role-based access control with audit logging
export const requireRole = (requiredRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError('Authentication required', 401);
      }

      // Get user with roles from database
      const user = await prisma.user.findFirst({
        where: { 
          id: req.user.userId,
          deletedAt: null,
        },
        include: {
          workspaceMembers: {
            where: { isActive: true },
            include: { role: true },
          },
        },
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Check if user has any of the required roles
      const userRoles = user.workspaceMembers.map(member => member.role.name);
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        // Log unauthorized access attempt
        securityEventStore.addEvent({
          type: SecurityEventType.PRIVILEGE_ESCALATION,
          userId: req.user.userId,
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          details: {
            requiredRoles,
            userRoles,
            url: req.originalUrl,
            method: req.method,
          },
          timestamp: new Date(),
          severity: 'high',
        });

        throw new ApiError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }

      logger.error('Role authorization error', error as Error, {
        userId: req.user?.userId,
        requiredRoles,
      });

      return res.status(500).json({
        success: false,
        error: 'Authorization failed',
      });
    }
  };
};

// Workspace access control
export const requireWorkspaceAccess = (workspaceIdParam: string = 'workspaceId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError('Authentication required', 401);
      }

      const workspaceId = req.params[workspaceIdParam] || req.body.workspaceId;
      
      if (!workspaceId) {
        throw new ApiError('Workspace ID required', 400);
      }

      // Check if user has access to the workspace
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId: req.user.userId,
          workspaceId,
          isActive: true,
        },
        include: { role: true },
      });

      if (!membership) {
        // Log unauthorized workspace access attempt
        securityEventStore.addEvent({
          type: SecurityEventType.DATA_BREACH_ATTEMPT,
          userId: req.user.userId,
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          details: {
            workspaceId,
            url: req.originalUrl,
            method: req.method,
          },
          timestamp: new Date(),
          severity: 'critical',
        });

        throw new ApiError('Workspace access denied', 403);
      }

      // Add workspace info to request
      (req as any).workspace = {
        id: workspaceId,
        role: membership.role,
      };

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }

      logger.error('Workspace access error', error as Error, {
        userId: req.user?.userId,
        workspaceId: req.params[workspaceIdParam],
      });

      return res.status(500).json({
        success: false,
        error: 'Workspace access validation failed',
      });
    }
  };
};

// API key authentication (for external integrations)
export const authenticateAPIKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new ApiError('API key required', 401);
    }

    // In production, store API keys in database with proper hashing
    // For now, we'll use environment variable
    const validAPIKey = process.env.API_KEY;
    
    if (!validAPIKey || apiKey !== validAPIKey) {
      securityEventStore.addEvent({
        type: SecurityEventType.INVALID_TOKEN,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        details: {
          type: 'api_key',
          key: apiKey.substring(0, 10) + '...',
          url: req.originalUrl,
        },
        timestamp: new Date(),
        severity: 'high',
      });

      throw new ApiError('Invalid API key', 401);
    }

    // Set API user context
    req.user = {
      userId: 'api-user',
      email: 'api@system',
      sessionId: 'api-session',
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(401).json({
      success: false,
      error: 'API key authentication failed',
    });
  }
};

// Session management endpoints
export const sessionManagement = {
  // Get user's active sessions
  getSessions: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        throw new ApiError('Authentication required', 401);
      }

      const sessions = authAdvancedService.getUserSessions(req.user.userId);
      
      res.json({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            id: session.id,
            ip: session.ip,
            userAgent: session.userAgent,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            isCurrent: session.id === req.user!.sessionId,
          })),
        },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to get sessions',
      });
    }
  },

  // Invalidate specific session
  invalidateSession: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        throw new ApiError('Authentication required', 401);
      }

      const { sessionId } = req.params;
      
      // Don't allow invalidating current session
      if (sessionId === req.user.sessionId) {
        throw new ApiError('Cannot invalidate current session', 400);
      }

      authAdvancedService.invalidateSession(sessionId);

      res.json({
        success: true,
        message: 'Session invalidated successfully',
      });
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to invalidate session',
      });
    }
  },

  // Invalidate all other sessions
  invalidateAllOtherSessions: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        throw new ApiError('Authentication required', 401);
      }

      const sessions = authAdvancedService.getUserSessions(req.user.userId);
      const otherSessions = sessions.filter(s => s.id !== req.user!.sessionId);
      
      otherSessions.forEach(session => {
        authAdvancedService.invalidateSession(session.id);
      });

      res.json({
        success: true,
        message: `${otherSessions.length} sessions invalidated successfully`,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to invalidate sessions',
      });
    }
  },
};

export { authAdvancedService };