import { Response } from 'express';
import { PageService } from '@/services/page.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const pageService = new PageService();

export const getWorkspacePages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { workspaceId } = req.params;
  const pages = await pageService.getWorkspacePages(workspaceId, req.user!.userId);
  
  res.json({
    success: true,
    data: { pages },
  });
});

export const getPageById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const page = await pageService.getPageById(id, req.user!.userId);
  
  res.json({
    success: true,
    data: { page },
  });
});

export const createPage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = await pageService.createPage(req.user!.userId, req.body);
  
  res.status(201).json({
    success: true,
    message: 'Page created successfully',
    data: { page },
  });
});

export const updatePage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const page = await pageService.updatePage(id, req.user!.userId, req.body);
  
  res.json({
    success: true,
    message: 'Page updated successfully',
    data: { page },
  });
});

export const deletePage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await pageService.deletePage(id, req.user!.userId);
  
  res.json({
    success: true,
    message: 'Page deleted successfully',
  });
});

export const duplicatePage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const page = await pageService.duplicatePage(id, req.user!.userId);
  
  res.status(201).json({
    success: true,
    message: 'Page duplicated successfully',
    data: { page },
  });
});