import { Comment } from '@prisma/client';
import prisma from '@/config/database';
import { ApiError } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';

export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  replies?: CommentWithAuthor[];
  _count?: {
    replies: number;
  };
}

export interface CreateCommentData {
  content: any;
  pageId?: string;
  blockId?: string;
  parentId?: string;
}

export interface UpdateCommentData {
  content?: any;
  isResolved?: boolean;
}

export class CommentService {
  async getPageComments(pageId: string, userId: string): Promise<CommentWithAuthor[]> {
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

      const comments = await prisma.comment.findMany({
        where: {
          pageId,
          deletedAt: null,
          parentId: null, // Only top-level comments
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          replies: {
            where: { deletedAt: null },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              replies: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return comments;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Get page comments error', error as Error, { pageId, userId });
      throw new ApiError('Failed to get comments', 500);
    }
  }

  async getBlockComments(blockId: string, userId: string): Promise<CommentWithAuthor[]> {
    try {
      // Check if user has access to the block's page
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

      if (block.page.workspace.members.length === 0 && !block.page.isPublic) {
        throw new ApiError('Access denied', 403);
      }

      const comments = await prisma.comment.findMany({
        where: {
          blockId,
          deletedAt: null,
          parentId: null, // Only top-level comments
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          replies: {
            where: { deletedAt: null },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              replies: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return comments;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Get block comments error', error as Error, { blockId, userId });
      throw new ApiError('Failed to get comments', 500);
    }
  }

  async createComment(userId: string, data: CreateCommentData): Promise<CommentWithAuthor> {
    try {
      // Validate that either pageId or blockId is provided
      if (!data.pageId && !data.blockId) {
        throw new ApiError('Either pageId or blockId must be provided', 400);
      }

      // Check permissions based on target
      if (data.pageId) {
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
      }

      if (data.blockId) {
        const block = await prisma.block.findFirst({
          where: {
            id: data.blockId,
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

        if (block.page.workspace.members.length === 0 && !block.page.isPublic) {
          throw new ApiError('Access denied', 403);
        }
      }

      // Check if parent comment exists and is accessible
      if (data.parentId) {
        const parentComment = await prisma.comment.findFirst({
          where: {
            id: data.parentId,
            deletedAt: null,
          },
        });

        if (!parentComment) {
          throw new ApiError('Parent comment not found', 404);
        }
      }

      const comment = await prisma.comment.create({
        data: {
          ...data,
          authorId: userId,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          replies: {
            where: { deletedAt: null },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              replies: {
                where: { deletedAt: null },
              },
            },
          },
        },
      });

      // Create notification for mentions (if any)
      await this.processMentions(comment.content, comment.id, userId);

      logger.info('Comment created', {
        commentId: comment.id,
        userId,
        pageId: data.pageId,
        blockId: data.blockId,
        parentId: data.parentId,
      });

      return comment;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Create comment error', error as Error, { userId, data });
      throw new ApiError('Failed to create comment', 500);
    }
  }

  async updateComment(commentId: string, userId: string, data: UpdateCommentData): Promise<CommentWithAuthor> {
    try {
      // Check if user owns the comment or has permission
      const existingComment = await prisma.comment.findFirst({
        where: {
          id: commentId,
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
                    },
                  },
                },
              },
            },
          },
          block: {
            include: {
              page: {
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
              },
            },
          },
        },
      });

      if (!existingComment) {
        throw new ApiError('Comment not found', 404);
      }

      // Check if user can edit (author or workspace member with edit permissions)
      const canEdit = existingComment.authorId === userId || 
        (existingComment.page?.workspace.members.length > 0) ||
        (existingComment.block?.page.workspace.members.length > 0);

      if (!canEdit) {
        throw new ApiError('Permission denied', 403);
      }

      // Mark as edited if content is being changed
      const updateData = {
        ...data,
        isEdited: data.content ? true : existingComment.isEdited,
      };

      const comment = await prisma.comment.update({
        where: { id: commentId },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          replies: {
            where: { deletedAt: null },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              replies: {
                where: { deletedAt: null },
              },
            },
          },
        },
      });

      // Process mentions if content was updated
      if (data.content) {
        await this.processMentions(data.content, commentId, userId);
      }

      logger.info('Comment updated', {
        commentId,
        userId,
        updatedFields: Object.keys(data),
      });

      return comment;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Update comment error', error as Error, { commentId, userId, data });
      throw new ApiError('Failed to update comment', 500);
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      // Check if user owns the comment or has permission
      const existingComment = await prisma.comment.findFirst({
        where: {
          id: commentId,
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
                        canDeletePages: true,
                      },
                    },
                  },
                },
              },
            },
          },
          block: {
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
                            canDeletePages: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!existingComment) {
        throw new ApiError('Comment not found', 404);
      }

      // Check if user can delete (author or workspace admin)
      const canDelete = existingComment.authorId === userId || 
        (existingComment.page?.workspace.members.length > 0) ||
        (existingComment.block?.page.workspace.members.length > 0);

      if (!canDelete) {
        throw new ApiError('Permission denied', 403);
      }

      // Soft delete comment and all replies
      await prisma.$transaction([
        prisma.comment.update({
          where: { id: commentId },
          data: { deletedAt: new Date() },
        }),
        prisma.comment.updateMany({
          where: { parentId: commentId },
          data: { deletedAt: new Date() },
        }),
      ]);

      logger.info('Comment deleted', { commentId, userId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Delete comment error', error as Error, { commentId, userId });
      throw new ApiError('Failed to delete comment', 500);
    }
  }

  async resolveComment(commentId: string, userId: string): Promise<CommentWithAuthor> {
    try {
      const comment = await this.updateComment(commentId, userId, { isResolved: true });
      
      logger.info('Comment resolved', { commentId, userId });
      
      return comment;
    } catch (error) {
      logger.error('Resolve comment error', error as Error, { commentId, userId });
      throw error;
    }
  }

  private async processMentions(content: any, commentId: string, authorId: string): Promise<void> {
    try {
      // Extract mentions from content (assuming content has mentions array)
      const mentions = this.extractMentions(content);
      
      if (mentions.length === 0) return;

      // Create notifications for mentioned users
      const notifications = mentions.map(userId => ({
        type: 'mention',
        title: 'You were mentioned in a comment',
        message: 'Someone mentioned you in a comment',
        data: {
          commentId,
          authorId,
        },
        userId,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      logger.info('Mention notifications created', {
        commentId,
        mentionedUsers: mentions,
      });
    } catch (error) {
      logger.error('Process mentions error', error as Error, { commentId, authorId });
      // Don't throw error as this is not critical
    }
  }

  private extractMentions(content: any): string[] {
    // Extract user IDs from mentions in content
    // This would depend on your content structure
    // For now, return empty array
    const mentions: string[] = [];
    
    if (content && content.mentions && Array.isArray(content.mentions)) {
      return content.mentions.map((mention: any) => mention.userId).filter(Boolean);
    }
    
    return mentions;
  }
}