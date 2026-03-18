import { Response } from 'express';
import { CommentService } from '@/services/comment.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const commentService = new CommentService();

export const getPageComments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { pageId } = req.params;
  const comments = await commentService.getPageComments(pageId, req.user!.userId);
  
  res.json({
    success: true,
    data: { comments },
  });
});

export const getBlockComments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { blockId } = req.params;
  const comments = await commentService.getBlockComments(blockId, req.user!.userId);
  
  res.json({
    success: true,
    data: { comments },
  });
});

export const createComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const comment = await commentService.createComment(req.user!.userId, req.body);
  
  res.status(201).json({
    success: true,
    message: 'Comment created successfully',
    data: { comment },
  });
});

export const updateComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const comment = await commentService.updateComment(id, req.user!.userId, req.body);
  
  res.json({
    success: true,
    message: 'Comment updated successfully',
    data: { comment },
  });
});

export const deleteComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await commentService.deleteComment(id, req.user!.userId);
  
  res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

export const resolveComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const comment = await commentService.resolveComment(id, req.user!.userId);
  
  res.json({
    success: true,
    message: 'Comment resolved successfully',
    data: { comment },
  });
});