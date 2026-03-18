import { Response } from 'express';
import { BlockService } from '@/services/block.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const blockService = new BlockService();

export const getPageBlocks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { pageId } = req.params;
  const blocks = await blockService.getPageBlocks(pageId, req.user!.userId);
  
  res.json({
    success: true,
    data: { blocks },
  });
});

export const createBlock = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const block = await blockService.createBlock(req.user!.userId, req.body);
  
  res.status(201).json({
    success: true,
    message: 'Block created successfully',
    data: { block },
  });
});

export const updateBlock = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const block = await blockService.updateBlock(id, req.user!.userId, req.body);
  
  res.json({
    success: true,
    message: 'Block updated successfully',
    data: { block },
  });
});

export const deleteBlock = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await blockService.deleteBlock(id, req.user!.userId);
  
  res.json({
    success: true,
    message: 'Block deleted successfully',
  });
});

export const moveBlock = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const block = await blockService.moveBlock(id, req.user!.userId, req.body);
  
  res.json({
    success: true,
    message: 'Block moved successfully',
    data: { block },
  });
});

export const duplicateBlock = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const block = await blockService.duplicateBlock(id, req.user!.userId);
  
  res.status(201).json({
    success: true,
    message: 'Block duplicated successfully',
    data: { block },
  });
});