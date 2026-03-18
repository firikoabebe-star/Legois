import { Response } from 'express';
import { DatabaseService } from '@/services/database.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const databaseService = new DatabaseService();

export const getWorkspaceDatabases = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { workspaceId } = req.params;
  const databases = await databaseService.getWorkspaceDatabases(workspaceId, req.user!.userId);
  
  res.json({
    success: true,
    data: { databases },
  });
});

export const getDatabaseById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = await databaseService.getDatabaseById(id, req.user!.userId);
  
  res.json({
    success: true,
    data: { database },
  });
});

export const createDatabase = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const database = await databaseService.createDatabase(req.user!.userId, req.body);
  
  res.status(201).json({
    success: true,
    message: 'Database created successfully',
    data: { database },
  });
});

export const updateDatabase = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = await databaseService.updateDatabase(id, req.user!.userId, req.body);
  
  res.json({
    success: true,
    message: 'Database updated successfully',
    data: { database },
  });
});

export const deleteDatabase = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await databaseService.deleteDatabase(id, req.user!.userId);
  
  res.json({
    success: true,
    message: 'Database deleted successfully',
  });
});

export const createProperty = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const property = await databaseService.createProperty(req.user!.userId, req.body);
  
  res.status(201).json({
    success: true,
    message: 'Property created successfully',
    data: { property },
  });
});

export const createRow = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const row = await databaseService.createRow(req.user!.userId, req.body);
  
  res.status(201).json({
    success: true,
    message: 'Row created successfully',
    data: { row },
  });
});

export const updateRowValue = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { rowId, propertyId } = req.params;
  const { value } = req.body;
  
  const databaseValue = await databaseService.updateRowValue(rowId, propertyId, value, req.user!.userId);
  
  res.json({
    success: true,
    message: 'Row value updated successfully',
    data: { value: databaseValue },
  });
});

export const deleteRow = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await databaseService.deleteRow(id, req.user!.userId);
  
  res.json({
    success: true,
    message: 'Row deleted successfully',
  });
});

export const createView = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const view = await databaseService.createView(req.user!.userId, req.body);
  
  res.status(201).json({
    success: true,
    message: 'View created successfully',
    data: { view },
  });
});