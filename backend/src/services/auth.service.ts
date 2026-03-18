import bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import prisma from '@/config/database';
import { generateTokens } from '@/utils/jwt';
import { ApiError } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';
import { 
  AuthUser, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest,
  JwtPayload 
} from '@/types/auth.types';

export class AuthService {
  private readonly SALT_ROUNDS = 10;

  private excludePassword(user: User): AuthUser {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            { username: data.username },
          ],
          deletedAt: null,
        },
      });

      if (existingUser) {
        if (existingUser.email === data.email) {
          throw new ApiError('Email already registered', 409);
        }
        if (existingUser.username === data.username) {
          throw new ApiError('Username already taken', 409);
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          password: hashedPassword,
          emailVerified: true, // Auto-verify for demo purposes
        },
      });

      // Generate tokens
      const jwtPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
      };

      const tokens = generateTokens(jwtPayload);

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
      });

      return {
        user: this.excludePassword(user),
        ...tokens,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Registration error', error as Error);
      throw new ApiError('Registration failed', 500);
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await prisma.user.findFirst({
        where: {
          email: data.email,
          deletedAt: null,
        },
      });

      if (!user) {
        throw new ApiError('Invalid email or password', 401);
      }

      if (!user.emailVerified) {
        throw new ApiError('Please verify your email before logging in', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) {
        throw new ApiError('Invalid email or password', 401);
      }

      // Generate tokens
      const jwtPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
      };

      const tokens = generateTokens(jwtPayload);

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
      });

      return {
        user: this.excludePassword(user),
        ...tokens,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Login error', error as Error);
      throw new ApiError('Login failed', 500);
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const { verifyRefreshToken } = await import('@/utils/jwt');
      const payload = verifyRefreshToken(refreshToken);

      // Verify user still exists
      const user = await prisma.user.findFirst({
        where: {
          id: payload.userId,
          deletedAt: null,
        },
      });

      if (!user) {
        throw new ApiError('User not found', 401);
      }

      // Generate new access token
      const jwtPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
      };

      const { generateAccessToken } = await import('@/utils/jwt');
      const accessToken = generateAccessToken(jwtPayload);

      return { accessToken };
    } catch (error) {
      logger.error('Token refresh error', error as Error);
      throw new ApiError('Invalid refresh token', 401);
    }
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
        },
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      return this.excludePassword(user);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Get current user error', error as Error);
      throw new ApiError('Failed to get user', 500);
    }
  }

  async updateProfile(userId: string, data: Partial<Pick<User, 'firstName' | 'lastName' | 'avatar' | 'theme' | 'language' | 'timezone'>>): Promise<AuthUser> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data,
      });

      logger.info('User profile updated', {
        userId: user.id,
        updatedFields: Object.keys(data),
      });

      return this.excludePassword(user);
    } catch (error) {
      logger.error('Update profile error', error as Error);
      throw new ApiError('Failed to update profile', 500);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new ApiError('Current password is incorrect', 400);
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      logger.info('Password changed successfully', { userId });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Change password error', error as Error);
      throw new ApiError('Failed to change password', 500);
    }
  }
}