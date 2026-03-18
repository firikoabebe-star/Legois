import { Workspace, WorkspaceMember, Role } from '@prisma/client';
import prisma from '@/config/database';
import { ApiError } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';

export interface WorkspaceWithMembers extends Workspace {
  members: (WorkspaceMember & {
    user: {
      id: string;
      email: string;
      username: string;
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
    };
    role: Role;
  })[];
  _count: {
    pages: number;
    members: number;
  };
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
  allowGuests?: boolean;
}

export class WorkspaceService {
  async getUserWorkspaces(userId: string): Promise<WorkspaceWithMembers[]> {
    try {
      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: {
          userId,
          isActive: true,
          workspace: {
            deletedAt: null,
          },
        },
        include: {
          workspace: {
            include: {
              members: {
                where: { isActive: true },
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      username: true,
                      firstName: true,
                      lastName: true,
                      avatar: true,
                    },
                  },
                  role: true,
                },
              },
              _count: {
                select: {
                  pages: {
                    where: { deletedAt: null },
                  },
                  members: {
                    where: { isActive: true },
                  },
                },
              },
            },
          },
          role: true,
        },
        orderBy: {
          workspace: {
            updatedAt: 'desc',
          },
        },
      });

      return workspaceMembers.map(member => member.workspace);
    } catch (error) {
      logger.error('Get user workspaces error', error as Error, { userId });
      throw new ApiError('Failed to get workspaces', 500);
    }
  }

  async getWorkspaceById(workspaceId: string, userId: string): Promise<WorkspaceWithMembers> {
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

      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          deletedAt: null,
        },
        include: {
          members: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
              role: true,
            },
            orderBy: {
              joinedAt: 'asc',
            },
          },
          _count: {
            select: {
              pages: {
                where: { deletedAt: null },
              },
              members: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      if (!workspace) {
        throw new ApiError('Workspace not found', 404);
      }

      return workspace;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Get workspace error', error as Error, { workspaceId, userId });
      throw new ApiError('Failed to get workspace', 500);
    }
  }

  async createWorkspace(userId: string, data: CreateWorkspaceData): Promise<WorkspaceWithMembers> {
    try {
      // Get owner role
      const ownerRole = await prisma.role.findFirst({
        where: { name: 'owner' },
      });

      if (!ownerRole) {
        throw new ApiError('Owner role not found', 500);
      }

      const workspace = await prisma.workspace.create({
        data: {
          ...data,
          creatorId: userId,
          members: {
            create: {
              userId,
              roleId: ownerRole.id,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
              role: true,
            },
          },
          _count: {
            select: {
              pages: true,
              members: true,
            },
          },
        },
      });

      logger.info('Workspace created', {
        workspaceId: workspace.id,
        userId,
        name: workspace.name,
      });

      return workspace;
    } catch (error) {
      logger.error('Create workspace error', error as Error, { userId, data });
      throw new ApiError('Failed to create workspace', 500);
    }
  }

  async updateWorkspace(workspaceId: string, userId: string, data: UpdateWorkspaceData): Promise<WorkspaceWithMembers> {
    try {
      // Check if user has permission to update workspace
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId,
          workspaceId,
          isActive: true,
          role: {
            OR: [
              { canManageSettings: true },
              { name: 'owner' },
            ],
          },
        },
      });

      if (!membership) {
        throw new ApiError('Permission denied', 403);
      }

      const workspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data,
        include: {
          members: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
              role: true,
            },
          },
          _count: {
            select: {
              pages: {
                where: { deletedAt: null },
              },
              members: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      logger.info('Workspace updated', {
        workspaceId,
        userId,
        updatedFields: Object.keys(data),
      });

      return workspace;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Update workspace error', error as Error, { workspaceId, userId, data });
      throw new ApiError('Failed to update workspace', 500);
    }
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    try {
      // Check if user is owner
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId,
          workspaceId,
          isActive: true,
          role: { name: 'owner' },
        },
      });

      if (!membership) {
        throw new ApiError('Only workspace owners can delete workspaces', 403);
      }

      // Soft delete workspace
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { deletedAt: new Date() },
      });

      logger.info('Workspace deleted', { workspaceId, userId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Delete workspace error', error as Error, { workspaceId, userId });
      throw new ApiError('Failed to delete workspace', 500);
    }
  }

  async inviteMember(workspaceId: string, inviterUserId: string, email: string, roleId: string): Promise<void> {
    try {
      // Check if inviter has permission
      const inviterMembership = await prisma.workspaceMember.findFirst({
        where: {
          userId: inviterUserId,
          workspaceId,
          isActive: true,
          role: {
            canInviteMembers: true,
          },
        },
      });

      if (!inviterMembership) {
        throw new ApiError('Permission denied', 403);
      }

      // Check if user exists
      const user = await prisma.user.findFirst({
        where: {
          email,
          deletedAt: null,
        },
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Check if user is already a member
      const existingMembership = await prisma.workspaceMember.findFirst({
        where: {
          userId: user.id,
          workspaceId,
        },
      });

      if (existingMembership) {
        if (existingMembership.isActive) {
          throw new ApiError('User is already a member', 409);
        } else {
          // Reactivate membership
          await prisma.workspaceMember.update({
            where: { id: existingMembership.id },
            data: {
              isActive: true,
              roleId,
              invitedBy: inviterUserId,
              invitedAt: new Date(),
            },
          });
        }
      } else {
        // Create new membership
        await prisma.workspaceMember.create({
          data: {
            userId: user.id,
            workspaceId,
            roleId,
            invitedBy: inviterUserId,
            invitedAt: new Date(),
          },
        });
      }

      logger.info('Member invited', {
        workspaceId,
        inviterUserId,
        invitedUserId: user.id,
        email,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Invite member error', error as Error, { workspaceId, inviterUserId, email });
      throw new ApiError('Failed to invite member', 500);
    }
  }

  async removeMember(workspaceId: string, removerUserId: string, memberUserId: string): Promise<void> {
    try {
      // Check if remover has permission
      const removerMembership = await prisma.workspaceMember.findFirst({
        where: {
          userId: removerUserId,
          workspaceId,
          isActive: true,
          role: {
            canManageMembers: true,
          },
        },
      });

      if (!removerMembership) {
        throw new ApiError('Permission denied', 403);
      }

      // Can't remove workspace owner
      const memberMembership = await prisma.workspaceMember.findFirst({
        where: {
          userId: memberUserId,
          workspaceId,
          isActive: true,
        },
        include: { role: true },
      });

      if (!memberMembership) {
        throw new ApiError('Member not found', 404);
      }

      if (memberMembership.role.name === 'owner') {
        throw new ApiError('Cannot remove workspace owner', 403);
      }

      // Deactivate membership
      await prisma.workspaceMember.update({
        where: { id: memberMembership.id },
        data: { isActive: false },
      });

      logger.info('Member removed', {
        workspaceId,
        removerUserId,
        removedUserId: memberUserId,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Remove member error', error as Error, { workspaceId, removerUserId, memberUserId });
      throw new ApiError('Failed to remove member', 500);
    }
  }

  async getRoles(): Promise<Role[]> {
    try {
      return await prisma.role.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      logger.error('Get roles error', error as Error);
      throw new ApiError('Failed to get roles', 500);
    }
  }
}