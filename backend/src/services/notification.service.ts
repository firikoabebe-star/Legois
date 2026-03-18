import { Notification } from '@prisma/client';
import prisma from '@/config/database';
import { ApiError } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';

export interface CreateNotificationData {
  type: string;
  title: string;
  message?: string;
  data?: any;
  workspaceId?: string;
}

export class NotificationService {
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
        },
        orderBy: [
          { isRead: 'asc' },
          { createdAt: 'desc' },
        ],
        take: limit,
      });

      return notifications;
    } catch (error) {
      logger.error('Get user notifications error', error as Error, { userId });
      throw new ApiError('Failed to get notifications', 500);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      logger.error('Get unread count error', error as Error, { userId });
      throw new ApiError('Failed to get unread count', 500);
    }
  }

  async createNotification(userId: string, data: CreateNotificationData): Promise<Notification> {
    try {
      const notification = await prisma.notification.create({
        data: {
          ...data,
          userId,
        },
      });

      logger.info('Notification created', {
        notificationId: notification.id,
        userId,
        type: data.type,
      });

      return notification;
    } catch (error) {
      logger.error('Create notification error', error as Error, { userId, data });
      throw new ApiError('Failed to create notification', 500);
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    try {
      // Check if notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        throw new ApiError('Notification not found', 404);
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      logger.info('Notification marked as read', { notificationId, userId });

      return updatedNotification;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Mark notification as read error', error as Error, { notificationId, userId });
      throw new ApiError('Failed to mark notification as read', 500);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      logger.info('All notifications marked as read', { userId });
    } catch (error) {
      logger.error('Mark all notifications as read error', error as Error, { userId });
      throw new ApiError('Failed to mark all notifications as read', 500);
    }
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      // Check if notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        throw new ApiError('Notification not found', 404);
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      logger.info('Notification deleted', { notificationId, userId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Delete notification error', error as Error, { notificationId, userId });
      throw new ApiError('Failed to delete notification', 500);
    }
  }

  // Helper methods for creating specific notification types
  async notifyMention(mentionedUserId: string, mentionerUserId: string, context: any): Promise<void> {
    try {
      const mentioner = await prisma.user.findUnique({
        where: { id: mentionerUserId },
        select: { username: true, firstName: true, lastName: true },
      });

      if (!mentioner) return;

      const displayName = mentioner.firstName && mentioner.lastName 
        ? `${mentioner.firstName} ${mentioner.lastName}`
        : mentioner.username;

      await this.createNotification(mentionedUserId, {
        type: 'mention',
        title: 'You were mentioned',
        message: `${displayName} mentioned you in a comment`,
        data: context,
        workspaceId: context.workspaceId,
      });
    } catch (error) {
      logger.error('Notify mention error', error as Error, { mentionedUserId, mentionerUserId });
    }
  }

  async notifyComment(targetUserId: string, commenterUserId: string, context: any): Promise<void> {
    try {
      const commenter = await prisma.user.findUnique({
        where: { id: commenterUserId },
        select: { username: true, firstName: true, lastName: true },
      });

      if (!commenter) return;

      const displayName = commenter.firstName && commenter.lastName 
        ? `${commenter.firstName} ${commenter.lastName}`
        : commenter.username;

      await this.createNotification(targetUserId, {
        type: 'comment',
        title: 'New comment',
        message: `${displayName} commented on your page`,
        data: context,
        workspaceId: context.workspaceId,
      });
    } catch (error) {
      logger.error('Notify comment error', error as Error, { targetUserId, commenterUserId });
    }
  }

  async notifyWorkspaceInvite(invitedUserId: string, inviterUserId: string, workspaceId: string): Promise<void> {
    try {
      const [inviter, workspace] = await Promise.all([
        prisma.user.findUnique({
          where: { id: inviterUserId },
          select: { username: true, firstName: true, lastName: true },
        }),
        prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { name: true },
        }),
      ]);

      if (!inviter || !workspace) return;

      const displayName = inviter.firstName && inviter.lastName 
        ? `${inviter.firstName} ${inviter.lastName}`
        : inviter.username;

      await this.createNotification(invitedUserId, {
        type: 'workspace_invite',
        title: 'Workspace invitation',
        message: `${displayName} invited you to join ${workspace.name}`,
        data: { workspaceId, inviterUserId },
        workspaceId,
      });
    } catch (error) {
      logger.error('Notify workspace invite error', error as Error, { invitedUserId, inviterUserId, workspaceId });
    }
  }

  async notifyPageShare(sharedWithUserId: string, sharerUserId: string, pageId: string): Promise<void> {
    try {
      const [sharer, page] = await Promise.all([
        prisma.user.findUnique({
          where: { id: sharerUserId },
          select: { username: true, firstName: true, lastName: true },
        }),
        prisma.page.findUnique({
          where: { id: pageId },
          select: { title: true, workspaceId: true },
        }),
      ]);

      if (!sharer || !page) return;

      const displayName = sharer.firstName && sharer.lastName 
        ? `${sharer.firstName} ${sharer.lastName}`
        : sharer.username;

      await this.createNotification(sharedWithUserId, {
        type: 'page_share',
        title: 'Page shared with you',
        message: `${displayName} shared "${page.title}" with you`,
        data: { pageId, sharerUserId },
        workspaceId: page.workspaceId,
      });
    } catch (error) {
      logger.error('Notify page share error', error as Error, { sharedWithUserId, sharerUserId, pageId });
    }
  }
}