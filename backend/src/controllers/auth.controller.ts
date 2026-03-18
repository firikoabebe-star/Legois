import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  
  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  
  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: result,
  });
});

export const getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.userId);
  
  res.json({
    success: true,
    data: { user },
  });
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.updateProfile(req.user!.userId, req.body);
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.userId, currentPassword, newPassword);
  
  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // In a real implementation, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Logout successful',
  });
});