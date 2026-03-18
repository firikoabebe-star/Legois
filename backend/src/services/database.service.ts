import { Database, DatabaseProperty, DatabaseRow, DatabaseValue, DatabaseView } from '@prisma/client';
import prisma from '@/config/database';
import { ApiError } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';

export interface DatabaseWithDetails extends Database {
  properties: DatabaseProperty[];
  rows: (DatabaseRow & {
    values: (DatabaseValue & {
      property: DatabaseProperty;
    })[];
  })[];
  views: DatabaseView[];
  _count: {
    rows: number;
  };
}

export interface CreateDatabaseData {
  name: string;
  description?: string;
  icon?: string;
  workspaceId: string;
}

export interface UpdateDatabaseData {
  name?: string;
  description?: string;
  icon?: string;
  defaultView?: string;
}

export interface CreatePropertyData {
  name: string;
  type: string;
  options?: any;
  formula?: string;
  databaseId: string;
}

export interface CreateRowData {
  databaseId: string;
  values: Record<string, any>;
}

export interface CreateViewData {
  name: string;
  type: string;
  config: any;
  databaseId: string;
  isDefault?: boolean;
}

export class DatabaseService {
  async getWorkspaceDatabases(workspaceId: string, userId: string): Promise<DatabaseWithDetails[]> {
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

      const databases = await prisma.database.findMany({
        where: {
          workspaceId,
          deletedAt: null,
        },
        include: {
          properties: {
            where: { isVisible: true },
            orderBy: { position: 'asc' },
          },
          rows: {
            where: { deletedAt: null },
            include: {
              values: {
                include: {
                  property: true,
                },
              },
            },
            orderBy: { position: 'asc' },
          },
          views: {
            orderBy: [
              { isDefault: 'desc' },
              { createdAt: 'asc' },
            ],
          },
          _count: {
            select: {
              rows: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return databases;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Get workspace databases error', error as Error, { workspaceId, userId });
      throw new ApiError('Failed to get databases', 500);
    }
  }

  async getDatabaseById(databaseId: string, userId: string): Promise<DatabaseWithDetails> {
    try {
      const database = await prisma.database.findFirst({
        where: {
          id: databaseId,
          deletedAt: null,
        },
        include: {
          properties: {
            where: { isVisible: true },
            orderBy: { position: 'asc' },
          },
          rows: {
            where: { deletedAt: null },
            include: {
              values: {
                include: {
                  property: true,
                },
              },
            },
            orderBy: { position: 'asc' },
          },
          views: {
            orderBy: [
              { isDefault: 'desc' },
              { createdAt: 'asc' },
            ],
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
          _count: {
            select: {
              rows: {
                where: { deletedAt: null },
              },
            },
          },
        },
      });

      if (!database) {
        throw new ApiError('Database not found', 404);
      }

      // Check if user has access to the workspace
      if (database.workspace.members.length === 0) {
        throw new ApiError('Access denied', 403);
      }

      return database;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Get database error', error as Error, { databaseId, userId });
      throw new ApiError('Failed to get database', 500);
    }
  }

  async createDatabase(userId: string, data: CreateDatabaseData): Promise<DatabaseWithDetails> {
    try {
      // Check if user has permission to create in workspace
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

      const database = await prisma.database.create({
        data: {
          ...data,
          properties: {
            create: [
              {
                name: 'Name',
                type: 'text',
                position: 0,
                isVisible: true,
              },
              {
                name: 'Status',
                type: 'select',
                position: 1,
                isVisible: true,
                options: {
                  options: [
                    { id: '1', name: 'Not Started', color: 'gray' },
                    { id: '2', name: 'In Progress', color: 'blue' },
                    { id: '3', name: 'Completed', color: 'green' },
                  ],
                },
              },
              {
                name: 'Created',
                type: 'created_time',
                position: 2,
                isVisible: true,
              },
            ],
          },
          views: {
            create: {
              name: 'All Items',
              type: 'table',
              isDefault: true,
              config: {
                filters: [],
                sorts: [],
                groupBy: null,
              },
            },
          },
        },
        include: {
          properties: {
            where: { isVisible: true },
            orderBy: { position: 'asc' },
          },
          rows: {
            where: { deletedAt: null },
            include: {
              values: {
                include: {
                  property: true,
                },
              },
            },
            orderBy: { position: 'asc' },
          },
          views: {
            orderBy: [
              { isDefault: 'desc' },
              { createdAt: 'asc' },
            ],
          },
          _count: {
            select: {
              rows: {
                where: { deletedAt: null },
              },
            },
          },
        },
      });

      logger.info('Database created', {
        databaseId: database.id,
        userId,
        workspaceId: data.workspaceId,
        name: database.name,
      });

      return database;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Create database error', error as Error, { userId, data });
      throw new ApiError('Failed to create database', 500);
    }
  }

  async updateDatabase(databaseId: string, userId: string, data: UpdateDatabaseData): Promise<DatabaseWithDetails> {
    try {
      // Check if user has permission to edit the database
      const database = await prisma.database.findFirst({
        where: {
          id: databaseId,
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

      if (!database) {
        throw new ApiError('Database not found', 404);
      }

      if (database.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      const updatedDatabase = await prisma.database.update({
        where: { id: databaseId },
        data,
        include: {
          properties: {
            where: { isVisible: true },
            orderBy: { position: 'asc' },
          },
          rows: {
            where: { deletedAt: null },
            include: {
              values: {
                include: {
                  property: true,
                },
              },
            },
            orderBy: { position: 'asc' },
          },
          views: {
            orderBy: [
              { isDefault: 'desc' },
              { createdAt: 'asc' },
            ],
          },
          _count: {
            select: {
              rows: {
                where: { deletedAt: null },
              },
            },
          },
        },
      });

      logger.info('Database updated', {
        databaseId,
        userId,
        updatedFields: Object.keys(data),
      });

      return updatedDatabase;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Update database error', error as Error, { databaseId, userId, data });
      throw new ApiError('Failed to update database', 500);
    }
  }

  async deleteDatabase(databaseId: string, userId: string): Promise<void> {
    try {
      // Check if user has permission to delete the database
      const database = await prisma.database.findFirst({
        where: {
          id: databaseId,
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

      if (!database) {
        throw new ApiError('Database not found', 404);
      }

      if (database.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      // Soft delete database
      await prisma.database.update({
        where: { id: databaseId },
        data: { deletedAt: new Date() },
      });

      logger.info('Database deleted', { databaseId, userId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Delete database error', error as Error, { databaseId, userId });
      throw new ApiError('Failed to delete database', 500);
    }
  }

  async createProperty(userId: string, data: CreatePropertyData): Promise<DatabaseProperty> {
    try {
      // Check if user has permission to edit the database
      const database = await prisma.database.findFirst({
        where: {
          id: data.databaseId,
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
          properties: true,
        },
      });

      if (!database) {
        throw new ApiError('Database not found', 404);
      }

      if (database.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      // Get next position
      const maxPosition = Math.max(...database.properties.map(p => p.position), -1);

      const property = await prisma.databaseProperty.create({
        data: {
          ...data,
          position: maxPosition + 1,
          isVisible: true,
        },
      });

      logger.info('Database property created', {
        propertyId: property.id,
        databaseId: data.databaseId,
        userId,
        name: property.name,
        type: property.type,
      });

      return property;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Create property error', error as Error, { userId, data });
      throw new ApiError('Failed to create property', 500);
    }
  }

  async createRow(userId: string, data: CreateRowData): Promise<DatabaseRow & { values: DatabaseValue[] }> {
    try {
      // Check if user has permission to edit the database
      const database = await prisma.database.findFirst({
        where: {
          id: data.databaseId,
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
          properties: true,
          rows: {
            where: { deletedAt: null },
          },
        },
      });

      if (!database) {
        throw new ApiError('Database not found', 404);
      }

      if (database.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      // Get next position
      const maxPosition = Math.max(...database.rows.map(r => r.position), -1);

      // Create row with values
      const row = await prisma.databaseRow.create({
        data: {
          databaseId: data.databaseId,
          position: maxPosition + 1,
          values: {
            create: Object.entries(data.values).map(([propertyId, value]) => ({
              propertyId,
              value: this.processValueForStorage(value, database.properties.find(p => p.id === propertyId)?.type),
            })),
          },
        },
        include: {
          values: true,
        },
      });

      logger.info('Database row created', {
        rowId: row.id,
        databaseId: data.databaseId,
        userId,
      });

      return row;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Create row error', error as Error, { userId, data });
      throw new ApiError('Failed to create row', 500);
    }
  }

  async updateRowValue(rowId: string, propertyId: string, value: any, userId: string): Promise<DatabaseValue> {
    try {
      // Check if user has permission to edit the row
      const row = await prisma.databaseRow.findFirst({
        where: {
          id: rowId,
          deletedAt: null,
        },
        include: {
          database: {
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
              properties: true,
            },
          },
        },
      });

      if (!row) {
        throw new ApiError('Row not found', 404);
      }

      if (row.database.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      const property = row.database.properties.find(p => p.id === propertyId);
      if (!property) {
        throw new ApiError('Property not found', 404);
      }

      const processedValue = this.processValueForStorage(value, property.type);

      const databaseValue = await prisma.databaseValue.upsert({
        where: {
          rowId_propertyId: {
            rowId,
            propertyId,
          },
        },
        update: {
          value: processedValue,
        },
        create: {
          rowId,
          propertyId,
          value: processedValue,
        },
      });

      logger.info('Database value updated', {
        rowId,
        propertyId,
        userId,
      });

      return databaseValue;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Update row value error', error as Error, { rowId, propertyId, userId });
      throw new ApiError('Failed to update row value', 500);
    }
  }

  async deleteRow(rowId: string, userId: string): Promise<void> {
    try {
      // Check if user has permission to delete the row
      const row = await prisma.databaseRow.findFirst({
        where: {
          id: rowId,
          deletedAt: null,
        },
        include: {
          database: {
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

      if (!row) {
        throw new ApiError('Row not found', 404);
      }

      if (row.database.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      // Soft delete row
      await prisma.databaseRow.update({
        where: { id: rowId },
        data: { deletedAt: new Date() },
      });

      logger.info('Database row deleted', { rowId, userId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Delete row error', error as Error, { rowId, userId });
      throw new ApiError('Failed to delete row', 500);
    }
  }

  async createView(userId: string, data: CreateViewData): Promise<DatabaseView> {
    try {
      // Check if user has permission to edit the database
      const database = await prisma.database.findFirst({
        where: {
          id: data.databaseId,
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

      if (!database) {
        throw new ApiError('Database not found', 404);
      }

      if (database.workspace.members.length === 0) {
        throw new ApiError('Permission denied', 403);
      }

      // If this is set as default, unset other defaults
      if (data.isDefault) {
        await prisma.databaseView.updateMany({
          where: {
            databaseId: data.databaseId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const view = await prisma.databaseView.create({
        data,
      });

      logger.info('Database view created', {
        viewId: view.id,
        databaseId: data.databaseId,
        userId,
        name: view.name,
        type: view.type,
      });

      return view;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Create view error', error as Error, { userId, data });
      throw new ApiError('Failed to create view', 500);
    }
  }

  private processValueForStorage(value: any, propertyType?: string): any {
    if (value === null || value === undefined) {
      return null;
    }

    switch (propertyType) {
      case 'number':
        return { number: parseFloat(value) || 0 };
      case 'checkbox':
        return { checked: Boolean(value) };
      case 'date':
        return { date: value };
      case 'select':
        return { select: value };
      case 'multi_select':
        return { multi_select: Array.isArray(value) ? value : [value] };
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
      default:
        return { text: String(value) };
    }
  }
}