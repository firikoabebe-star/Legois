import { Page, Block } from '@prisma/client';
import prisma from '@/config/database';
import { ApiError } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';

export interface PageWithBlocks extends Page {
  blocks: Block[];
  children?: PageWithBlocks[];
}

export interface CreatePageData {
  title: string;
  icon?: string;
  cover?: string;
  parentId?: string;
  workspaceId: string;
  content?: any;
}

export interface UpdatePageData {
  title?: string;
  icon?: string;
  cover?: string;
  parentId?: string;
  content?: any;
  isPublic?: boolean;
  isTemplate?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
}

export class PageService {
  async getWorkspacePages(workspaceId: string, userId: string): Promise<PageWithBlocks[]> {
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

      const pages = await prisma.page.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          parentId: null, // Only root pages
        },
        include: {
          blocks: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
          },
          children: {
            where: { deletedAt: null },
            include: {
              blocks: {
                where: { deletedAt: null },
                orderBy: { position: 'asc' },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return pages;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Get workspace pages error', error as Error, { workspaceId, userId });
      throw new ApiError('Failed to get pages', 500);
    }
  }

  async getPageById(pageId: string, userId: string): Promise<PageWithBlocks> {
    try {
      const page = await prisma.page.findFirst({
        where: {
          id: pageId,
          deletedAt: null,
        },
        include: {
          blocks: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
          },
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

      // Check if user has access to the workspace
      if (page.workspace.members.length === 0 && !page.isPublic) {
        throw new ApiError('Access denied', 403);
      }

      return page;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Get page error', error as Error, { pageId, userId });
      throw new ApiError('Failed to get page', 500);
    }
  }

  async createPage(userId: string, data: CreatePageData): Promise<PageWithBlocks> {
    try {
      // Check if user has permission to create pages in workspace
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId,
          workspaceId: data.workspaceId,
          isActive: true,
          role: {
            canCreatePages: true,
          },
        },
      });

      if (!membership) {
        throw new ApiError('Permission denied', 403);
      }

      // If parentId is provided, check if parent exists and user has access
      if (data.parentId) {
        const parentPage = await prisma.page.findFirst({
          where: {
            id: data.parentId,
            workspaceId: data.workspaceId,
            deletedAt: null,
          },
        });

        if (!parentPage) {
          throw new ApiError('Parent page not found', 404);
        }
      }

      const page = await prisma.page.create({
        data: {
          ...data,
          creatorId: userId,
        },
        include: {
          blocks: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
          },
        },
      });

      // Create initial empty text block
      await prisma.block.create({
        data: {
          type: 'text',
          content: { text: '' },
          position: 0,
          pageId: page.id,
          creatorId: userId,
        },
      });

      logger.info('Page created', {
        pageId: page.id,
        userId,
        workspaceId: data.workspaceId,
        title: page.title,
      });

      return page;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Create page error', error as Error, { userId, data });
      throw new ApiError('Failed to create page', 500);
    }
  }

  async updatePage(pageId: string, userId: string, data: UpdatePageData): Promise<PageWithBlocks> {
    try {
      // Check if user has permission to edit the page
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
                  role: {
                    canEditPages: true,
                  },
                },
              },
            },
          },
        },
      });

      if (!page) {
        throw new ApiError('Page not found', 404);
      }

      if (page.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      const updatedPage = await prisma.page.update({
        where: { id: pageId },
        data,
        include: {
          blocks: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
          },
        },
      });

      logger.info('Page updated', {
        pageId,
        userId,
        updatedFields: Object.keys(data),
      });

      return updatedPage;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Update page error', error as Error, { pageId, userId, data });
      throw new ApiError('Failed to update page', 500);
    }
  }

  async deletePage(pageId: string, userId: string): Promise<void> {
    try {
      // Check if user has permission to delete the page
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
                  role: {
                    canDeletePages: true,
                  },
                },
              },
            },
          },
        },
      });

      if (!page) {
        throw new ApiError('Page not found', 404);
      }

      if (page.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      // Soft delete page and all its blocks
      await prisma.$transaction([
        prisma.page.update({
          where: { id: pageId },
          data: { deletedAt: new Date() },
        }),
        prisma.block.updateMany({
          where: { pageId },
          data: { deletedAt: new Date() },
        }),
      ]);

      logger.info('Page deleted', { pageId, userId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Delete page error', error as Error, { pageId, userId });
      throw new ApiError('Failed to delete page', 500);
    }
  }

  async duplicatePage(pageId: string, userId: string): Promise<PageWithBlocks> {
    try {
      const originalPage = await this.getPageById(pageId, userId);

      const duplicatedPage = await prisma.page.create({
        data: {
          title: `${originalPage.title} (Copy)`,
          icon: originalPage.icon,
          cover: originalPage.cover,
          content: originalPage.content,
          workspaceId: originalPage.workspaceId,
          creatorId: userId,
        },
        include: {
          blocks: true,
        },
      });

      // Duplicate all blocks
      if (originalPage.blocks.length > 0) {
        const blocksToCreate = originalPage.blocks.map(block => ({
          type: block.type,
          content: block.content,
          position: block.position,
          pageId: duplicatedPage.id,
          creatorId: userId,
        }));

        await prisma.block.createMany({
          data: blocksToCreate,
        });
      }

      logger.info('Page duplicated', {
        originalPageId: pageId,
        newPageId: duplicatedPage.id,
        userId,
      });

      return duplicatedPage;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Duplicate page error', error as Error, { pageId, userId });
      throw new ApiError('Failed to duplicate page', 500);
    }
  }
}