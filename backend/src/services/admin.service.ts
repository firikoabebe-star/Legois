import { User, Workspace, ActivityLog } from '@prisma/client';
import prisma from '@/config/database';
import { ApiError } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';

export interface AdminStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalPages: number;
  totalBlocks: number;
  activeUsers: number;
  newUsersThisMonth: number;
  newWorkspacesThisMonth: number;
}

export interface UserWithWorkspaces extends User {
  workspaceMembers: {
    workspace: {
      id: string;
      name: string;
    };
    role: {
      name: string;
    };
  }[];
  _count: {
    createdPages: number;
    comments: number;
  };
}

export interface WorkspaceWithStats extends Workspace {
  creator: {
    id: string;
    username: string;
    email: string;
  };
  _count: {
    members: number;
    pages: number;
  };
}

export class AdminService {
  async getSystemStats(): Promise<AdminStats> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        totalWorkspaces,
        totalPages,
        totalBlocks,
        activeUsers,
        newUsersThisMonth,
        newWorkspacesThisMonth,
      ] = await Promise.all([
        prisma.user.count({
          where: { deletedAt: null },
        }),
        prisma.workspace.count({
          where: { deletedAt: null },
        }),
        prisma.page.count({
          where: { deletedAt: null },
        }),
        prisma.block.count({
          where: { deletedAt: null },
        }),
        prisma.user.count({
          where: {
            deletedAt: null,
            updatedAt: {
              gte: thirtyDaysAgo,
            },
          },
        }),
        prisma.user.count({
          where: {
            deletedAt: null,
            createdAt: {
              gte: startOfMonth,
            },
          },
        }),
        prisma.workspace.count({
          where: {
            deletedAt: null,
            createdAt: {
              gte: startOfMonth,
            },
          },
        }),
      ]);

      return {
        totalUsers,
        totalWorkspaces,
        totalPages,
        totalBlocks,
        activeUsers,
        newUsersThisMonth,
        newWorkspacesThisMonth,
      };
    } catch (error) {
      logger.error('Get system stats error', error as Error);
      throw new ApiError('Failed to get system stats', 500);
    }
  }

  async getAllUsers(page: number = 1, limit: number = 20, search?: string): Promise<{
    users: UserWithWorkspaces[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        deletedAt: null,
        ...(search && {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { username: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            workspaceMembers: {
              where: { isActive: true },
              include: {
                workspace: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                createdPages: {
                  where: { deletedAt: null },
                },
                comments: {
                  where: { deletedAt: null },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Get all users error', error as Error);
      throw new ApiError('Failed to get users', 500);
    }
  }

  async getAllWorkspaces(page: number = 1, limit: number = 20, search?: string): Promise<{
    workspaces: WorkspaceWithStats[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [workspaces, total] = await Promise.all([
        prisma.workspace.findMany({
          where,
          skip,
          take: limit,
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            _count: {
              select: {
                members: {
                  where: { isActive: true },
                },
                pages: {
                  where: { deletedAt: null },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.workspace.count({ where }),
      ]);

      return {
        workspaces,
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Get all workspaces error', error as Error);
      throw new ApiError('Failed to get workspaces', 500);
    }
  }

  async getRecentActivity(limit: number = 50): Promise<ActivityLog[]> {
    try {
      return await prisma.activityLog.findMany({
        take: limit,
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
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
          page: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      logger.error('Get recent activity error', error as Error);
      throw new ApiError('Failed to get recent activity', 500);
    }
  }

  async suspendUser(userId: string, adminUserId: string): Promise<void> {
    try {
      // Check if user exists
      const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Soft delete user (suspend)
      await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });

      // Log the action
      await prisma.activityLog.create({
        data: {
          action: 'suspended',
          entity: 'user',
          entityId: userId,
          details: {
            suspendedBy: adminUserId,
            reason: 'Admin action',
          },
          userId: adminUserId,
        },
      });

      logger.info('User suspended', { userId, adminUserId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Suspend user error', error as Error, { userId, adminUserId });
      throw new ApiError('Failed to suspend user', 500);
    }
  }

  async reactivateUser(userId: string, adminUserId: string): Promise<void> {
    try {
      // Check if user exists (including soft deleted)
      const user = await prisma.user.findFirst({
        where: { id: userId },
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Reactivate user
      await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: null },
      });

      // Log the action
      await prisma.activityLog.create({
        data: {
          action: 'reactivated',
          entity: 'user',
          entityId: userId,
          details: {
            reactivatedBy: adminUserId,
            reason: 'Admin action',
          },
          userId: adminUserId,
        },
      });

      logger.info('User reactivated', { userId, adminUserId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Reactivate user error', error as Error, { userId, adminUserId });
      throw new ApiError('Failed to reactivate user', 500);
    }
  }

  async deleteWorkspace(workspaceId: string, adminUserId: string): Promise<void> {
    try {
      // Check if workspace exists
      const workspace = await prisma.workspace.findFirst({
        where: { id: workspaceId, deletedAt: null },
      });

      if (!workspace) {
        throw new ApiError('Workspace not found', 404);
      }

      // Soft delete workspace
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { deletedAt: new Date() },
      });

      // Log the action
      await prisma.activityLog.create({
        data: {
          action: 'deleted',
          entity: 'workspace',
          entityId: workspaceId,
          details: {
            deletedBy: adminUserId,
            reason: 'Admin action',
            workspaceName: workspace.name,
          },
          userId: adminUserId,
          workspaceId,
        },
      });

      logger.info('Workspace deleted by admin', { workspaceId, adminUserId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Delete workspace error', error as Error, { workspaceId, adminUserId });
      throw new ApiError('Failed to delete workspace', 500);
    }
  }

  async getGrowthMetrics(): Promise<{
    userGrowth: { date: string; count: number }[];
    workspaceGrowth: { date: string; count: number }[];
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get daily user registrations for the last 30 days
      const userGrowthData = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= ${thirtyDaysAgo}
        AND deleted_at IS NULL
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      // Get daily workspace creations for the last 30 days
      const workspaceGrowthData = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM workspaces
        WHERE created_at >= ${thirtyDaysAgo}
        AND deleted_at IS NULL
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      return {
        userGrowth: userGrowthData.map(item => ({
          date: item.date.toISOString().split('T')[0],
          count: Number(item.count),
        })),
        workspaceGrowth: workspaceGrowthData.map(item => ({
          date: item.date.toISOString().split('T')[0],
          count: Number(item.count),
        })),
      };
    } catch (error) {
      logger.error('Get growth metrics error', error as Error);
      throw new ApiError('Failed to get growth metrics', 500);
    }
  }
}