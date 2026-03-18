import { User } from '@prisma/client';

export interface AuthUser extends Omit<User, 'password'> {}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}