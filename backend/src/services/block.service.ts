import { Block } from '@prisma/client';
import prisma from '@/config/database';
import { ApiError } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';

export interface CreateBlockData {
  type: string;
  content: any;
  position: number;
  parentId?: string;
  pageId: string;
}

export interface UpdateBlockData {
  type?: string;
  content?: any;
  position?: number;
  parentId?: string;
}

export interface MoveBlockData {
  position: number;
  parentId?: string;
}

export class BlockService {
  async getPageBlocks(pageId: string, userId: string): Promise<Block[]> {
    try {
      // Check if user has access to the page
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

      const blocks = await prisma.block.findMany({
        where: {
          pageId,
          deletedAt: null,
        },
        orderBy: { position: 'asc' },
      });

      return blocks;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Get page blocks error', error as Error, { pageId, userId });
      throw new ApiError('Failed to get blocks', 500);
    }
  }

  async createBlock(userId: string, data: CreateBlockData): Promise<Block> {
    try {
      // Check if user has permission to edit the page
      const page = await prisma.page.findFirst({
        where: {
          id: data.pageId,
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

      // If position is not at the end, shift other blocks
      if (data.position !== undefined) {
        await prisma.block.updateMany({
          where: {
            pageId: data.pageId,
            position: { gte: data.position },
            deletedAt: null,
          },
          data: {
            position: { increment: 1 },
          },
        });
      }

      const block = await prisma.block.create({
        data: {
          ...data,
          creatorId: userId,
        },
      });

      logger.info('Block created', {
        blockId: block.id,
        pageId: data.pageId,
        userId,
        type: block.type,
      });

      return block;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Create block error', error as Error, { userId, data });
      throw new ApiError('Failed to create block', 500);
    }
  }

  async updateBlock(blockId: string, userId: string, data: UpdateBlockData): Promise<Block> {
    try {
      // Check if user has permission to edit the block
      const block = await prisma.block.findFirst({
        where: {
          id: blockId,
          deletedAt: null,
        },
        include: {
          page: {
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
          },
        },
      });

      if (!block) {
        throw new ApiError('Block not found', 404);
      }

      if (block.page.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      const updatedBlock = await prisma.block.update({
        where: { id: blockId },
        data,
      });

      logger.info('Block updated', {
        blockId,
        userId,
        updatedFields: Object.keys(data),
      });

      return updatedBlock;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Update block error', error as Error, { blockId, userId, data });
      throw new ApiError('Failed to update block', 500);
    }
  }

  async deleteBlock(blockId: string, userId: string): Promise<void> {
    try {
      // Check if user has permission to edit the block
      const block = await prisma.block.findFirst({
        where: {
          id: blockId,
          deletedAt: null,
        },
        include: {
          page: {
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
          },
        },
      });

      if (!block) {
        throw new ApiError('Block not found', 404);
      }

      if (block.page.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      // Soft delete block
      await prisma.block.update({
        where: { id: blockId },
        data: { deletedAt: new Date() },
      });

      // Shift remaining blocks up
      await prisma.block.updateMany({
        where: {
          pageId: block.pageId,
          position: { gt: block.position },
          deletedAt: null,
        },
        data: {
          position: { decrement: 1 },
        },
      });

      logger.info('Block deleted', { blockId, userId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Delete block error', error as Error, { blockId, userId });
      throw new ApiError('Failed to delete block', 500);
    }
  }

  async moveBlock(blockId: string, userId: string, data: MoveBlockData): Promise<Block> {
    try {
      // Check if user has permission to edit the block
      const block = await prisma.block.findFirst({
        where: {
          id: blockId,
          deletedAt: null,
        },
        include: {
          page: {
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
          },
        },
      });

      if (!block) {
        throw new ApiError('Block not found', 404);
      }

      if (block.page.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      const oldPosition = block.position;
      const newPosition = data.position;

      // Use transaction to ensure consistency
      await prisma.$transaction(async (tx) => {
        // First, shift blocks to make space or fill gap
        if (newPosition > oldPosition) {
          // Moving down: shift blocks up
          await tx.block.updateMany({
            where: {
              pageId: block.pageId,
              position: {
                gt: oldPosition,
                lte: newPosition,
              },
              deletedAt: null,
            },
            data: {
              position: { decrement: 1 },
            },
          });
        } else if (newPosition < oldPosition) {
          // Moving up: shift blocks down
          await tx.block.updateMany({
            where: {
              pageId: block.pageId,
              position: {
                gte: newPosition,
                lt: oldPosition,
              },
              deletedAt: null,
            },
            data: {
              position: { increment: 1 },
            },
          });
        }

        // Update the moved block
        await tx.block.update({
          where: { id: blockId },
          data: {
            position: newPosition,
            parentId: data.parentId,
          },
        });
      });

      const updatedBlock = await prisma.block.findUnique({
        where: { id: blockId },
      });

      logger.info('Block moved', {
        blockId,
        userId,
        oldPosition,
        newPosition,
      });

      return updatedBlock!;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Move block error', error as Error, { blockId, userId, data });
      throw new ApiError('Failed to move block', 500);
    }
  }

  async duplicateBlock(blockId: string, userId: string): Promise<Block> {
    try {
      const originalBlock = await prisma.block.findFirst({
        where: {
          id: blockId,
          deletedAt: null,
        },
        include: {
          page: {
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
          },
        },
      });

      if (!originalBlock) {
        throw new ApiError('Block not found', 404);
      }

      if (originalBlock.page.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      // Shift blocks down to make space
      await prisma.block.updateMany({
        where: {
          pageId: originalBlock.pageId,
          position: { gt: originalBlock.position },
          deletedAt: null,
        },
        data: {
          position: { increment: 1 },
        },
      });

      // Create duplicate block
      const duplicatedBlock = await prisma.block.create({
        data: {
          type: originalBlock.type,
          content: originalBlock.content,
          position: originalBlock.position + 1,
          parentId: originalBlock.parentId,
          pageId: originalBlock.pageId,
          creatorId: userId,
        },
      });

      logger.info('Block duplicated', {
        originalBlockId: blockId,
        newBlockId: duplicatedBlock.id,
        userId,
      });

      return duplicatedBlock;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Duplicate block error', error as Error, { blockId, userId });
      throw new ApiError('Failed to duplicate block', 500);
    }
  }
}