import { ActivityLog } from '@prisma/client';
import prisma from '@/config/database';
import { ApiError } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';

export interface ActivityLogWithUser extends ActivityLog {
  user: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
}

export interface CreateActivityData {
  action: string;
  entity: string;
  entityId: string;
  details?: any;
  workspaceId?: string;
  pageId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityService {
  async getWorkspaceActivity(workspaceId: string, userId: string, limit: number = 50): Promise<ActivityLogWithUser[]> {
    try {
      // Check if user has access to workspace
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId,
          workspaceId,
          isActive: true,
        },
      });

      if (!membership) {
        throw new ApiError('Workspace not found or access denied', 404);
      }

      const activities = await prisma.activityLog.findMany({
        where: {
          workspaceId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return activities;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Get workspace activity error', error as Error, { workspaceId, userId });
      throw new ApiError('Failed to get activity', 500);
    }
  }

  async getPageActivity(pageId: string, userId: string, limit: number = 50): Promise<ActivityLogWithUser[]> {
    try {
      // Check if user has access to page
      const page = await prisma.page.findFirst({
        where: {
          id: pageId,
          deletedAt: null,
        },
        include: {
          workspace: {
            include: {
              members: {
                where: {
                  userId,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!page) {
        throw new ApiError('Page not found', 404);
      }

      if (page.workspace.members.length === 0 && !page.isPublic) {
        throw new ApiError('Access denied', 403);
      }

      const activities = await prisma.activityLog.findMany({
        where: {
          pageId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return activities;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Get page activity error', error as Error, { pageId, userId });
      throw new ApiError('Failed to get activity', 500);
    }
  }

  async createActivity(userId: string, data: CreateActivityData): Promise<ActivityLogWithUser> {
    try {
      const activity = await prisma.activityLog.create({
        data: {
          ...data,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      logger.info('Activity logged', {
        activityId: activity.id,
        userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
      });

      return activity;
    } catch (error) {
      logger.error('Create activity error', error as Error, { userId, data });
      throw new ApiError('Failed to create activity', 500);
    }
  }

  async logPageActivity(
    userId: string, 
    action: string, 
    pageId: string, 
    details?: any,
    req?: any
  ): Promise<void> {
    try {
      // Get page info for workspace context
      const page = await prisma.page.findFirst({
        where: { id: pageId },
        select: { workspaceId: true, title: true },
      });

      if (!page) return;

      await this.createActivity(userId, {
        action,
        entity: 'page',
        entityId: pageId,
        details: {
          pageTitle: page.title,
          ...details,
        },
        workspaceId: page.workspaceId,
        pageId,
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent'),
      });
    } catch (error) {
      logger.error('Log page activity error', error as Error, { userId, action, pageId });
      // Don't throw error as activity logging is not critical
    }
  }

  async logBlockActivity(
    userId: string, 
    action: string, 
    blockId: string, 
    details?: any,
    req?: any
  ): Promise<void> {
    try {
      // Get block info for page/workspace context
      const block = await prisma.block.findFirst({
        where: { id: blockId },
        include: {
          page: {
            select: { id: true, title: true, workspaceId: true },
          },
        },
      });

      if (!block) return;

      await this.createActivity(userId, {
        action,
        entity: 'block',
        entityId: blockId,
        details: {
          blockType: block.type,
          pageTitle: block.page.title,
          ...details,
        },
        workspaceId: block.page.workspaceId,
        pageId: block.page.id,
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent'),
      });
    } catch (error) {
      logger.error('Log block activity error', error as Error, { userId, action, blockId });
      // Don't throw error as activity logging is not critical
    }
  }

  async logWorkspaceActivity(
    userId: string, 
    action: string, 
    workspaceId: string, 
    details?: any,
    req?: any
  ): Promise<void> {
    try {
      await this.createActivity(userId, {
        action,
        entity: 'workspace',
        entityId: workspaceId,
        details,
        workspaceId,
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent'),
      });
    } catch (error) {
      logger.error('Log workspace activity error', error as Error, { userId, action, workspaceId });
      // Don't throw error as activity logging is not critical
    }
  }

  async logDatabaseActivity(
    userId: string, 
    action: string, 
    databaseId: string, 
    details?: any,
    req?: any
  ): Promise<void> {
    try {
      // Get database info for workspace context
      const database = await prisma.database.findFirst({
        where: { id: databaseId },
        select: { workspaceId: true, name: true },
      });

      if (!database) return;

      await this.createActivity(userId, {
        action,
        entity: 'database',
        entityId: databaseId,
        details: {
          databaseName: database.name,
          ...details,
        },
        workspaceId: database.workspaceId,
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent'),
      });
    } catch (error) {
      logger.error('Log database activity error', error as Error, { userId, action, databaseId });
      // Don't throw error as activity logging is not critical
    }
  }

  async getUserActivity(userId: string, limit: number = 50): Promise<ActivityLogWithUser[]> {
    try {
      const activities = await prisma.activityLog.findMany({
        where: {
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return activities;
    } catch (error) {
      logger.error('Get user activity error', error as Error, { userId });
      throw new ApiError('Failed to get user activity', 500);
    }
  }

  async getActivityStats(workspaceId: string, userId: string): Promise<any> {
    try {
      // Check if user has access to workspace
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId,
          workspaceId,
          isActive: true,
        },
      });

      if (!membership) {
        throw new ApiError('Workspace not found or access denied', 404);
      }

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [weeklyActivity, monthlyActivity, topUsers, recentActions] = await Promise.all([
        // Weekly activity count
        prisma.activityLog.count({
          where: {
            workspaceId,
            createdAt: { gte: weekAgo },
          },
        }),
        
        // Monthly activity count
        prisma.activityLog.count({
          where: {
            workspaceId,
            createdAt: { gte: monthAgo },
          },
        }),
        
        // Top active users
        prisma.activityLog.groupBy({
          by: ['userId'],
          where: {
            workspaceId,
            createdAt: { gte: weekAgo },
          },
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 5,
        }),
        
        // Recent action types
        prisma.activityLog.groupBy({
          by: ['action'],
          where: {
            workspaceId,
            createdAt: { gte: weekAgo },
          },
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 10,
        }),
      ]);

      return {
        weeklyActivity,
        monthlyActivity,
        topUsers,
        recentActions,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Get activity stats error', error as Error, { workspaceId, userId });
      throw new ApiError('Failed to get activity stats', 500);
    }
  }
}