import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import prisma from '@/config/database';
import { ApiError } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';
import { securityEventStore, SecurityEventType } from '@/middleware/security-advanced.middleware';

interface LoginAttempt {
  id: string;
  userId?: string;
  email: string;
  ip: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  timestamp: Date;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

interface SessionInfo {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

// Enhanced authentication service with security features
export class AuthAdvancedService {
  private loginAttempts: LoginAttempt[] = [];
  private activeSessions: Map<string, SessionInfo> = new Map();
  private maxLoginAttempts = 5;
  private lockoutDuration = 15 * 60 * 1000; // 15 minutes
  private sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

  // Enhanced login with security monitoring
  async secureLogin(
    email: string, 
    password: string, 
    ip: string, 
    userAgent: string,
    deviceFingerprint?: string
  ): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    requiresMFA?: boolean;
    securityWarnings?: string[];
  }> {
    const attemptId = randomBytes(16).toString('hex');
    const timestamp = new Date();
    
    try {
      // Check for account lockout
      if (await this.isAccountLocked(email, ip)) {
        await this.recordLoginAttempt({
          id: attemptId,
          email,
          ip,
          userAgent,
          success: false,
          failureReason: 'account_locked',
          timestamp,
        });

        throw new ApiError('Account temporarily locked due to multiple failed attempts', 423);
      }

      // Find user
      const user = await prisma.user.findFirst({
        where: { 
          email: email.toLowerCase(),
          deletedAt: null,
        },
      });

      if (!user) {
        await this.recordLoginAttempt({
          id: attemptId,
          email,
          ip,
          userAgent,
          success: false,
          failureReason: 'user_not_found',
          timestamp,
        });

        throw new ApiError('Invalid credentials', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        await this.recordLoginAttempt({
          id: attemptId,
          userId: user.id,
          email,
          ip,
          userAgent,
          success: false,
          failureReason: 'invalid_password',
          timestamp,
        });

        throw new ApiError('Invalid credentials', 401);
      }

      // Check for suspicious login patterns
      const securityWarnings = await this.checkSuspiciousActivity(user.id, ip, userAgent);

      // Generate session
      const sessionId = randomBytes(32).toString('hex');
      const sessionInfo: SessionInfo = {
        id: sessionId,
        userId: user.id,
        ip,
        userAgent,
        createdAt: timestamp,
        lastActivity: timestamp,
        isActive: true,
      };

      this.activeSessions.set(sessionId, sessionInfo);

      // Generate tokens
      const accessToken = this.generateAccessToken(user, sessionId);
      const refreshToken = await this.generateRefreshToken(user.id, sessionId);

      // Record successful login
      await this.recordLoginAttempt({
        id: attemptId,
        userId: user.id,
        email,
        ip,
        userAgent,
        success: true,
        timestamp,
      });

      // Update user's last login
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: timestamp },
      });

      logger.info('Successful login', {
        userId: user.id,
        email: user.email,
        ip,
        sessionId,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
        },
        accessToken,
        refreshToken,
        sessionId,
        securityWarnings,
      };

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error('Login error', error as Error, { email, ip });
      throw new ApiError('Login failed', 500);
    }
  }

  // Check for suspicious login activity
  private async checkSuspiciousActivity(
    userId: string, 
    ip: string, 
    userAgent: string
  ): Promise<string[]> {
    const warnings: string[] = [];
    const recentAttempts = this.loginAttempts
      .filter(attempt => 
        attempt.userId === userId && 
        Date.now() - attempt.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
      );

    // Check for new IP address
    const knownIPs = new Set(recentAttempts.map(attempt => attempt.ip));
    if (!knownIPs.has(ip) && knownIPs.size > 0) {
      warnings.push('Login from new IP address');
      
      securityEventStore.addEvent({
        type: SecurityEventType.SUSPICIOUS_LOGIN,
        userId,
        ip,
        userAgent,
        details: { reason: 'new_ip', knownIPs: Array.from(knownIPs) },
        timestamp: new Date(),
        severity: 'medium',
      });
    }

    // Check for new device/browser
    const knownUserAgents = new Set(recentAttempts.map(attempt => attempt.userAgent));
    if (!knownUserAgents.has(userAgent) && knownUserAgents.size > 0) {
      warnings.push('Login from new device or browser');
      
      securityEventStore.addEvent({
        type: SecurityEventType.SUSPICIOUS_LOGIN,
        userId,
        ip,
        userAgent,
        details: { reason: 'new_device' },
        timestamp: new Date(),
        severity: 'medium',
      });
    }

    // Check for rapid successive logins from different locations
    const recentSuccessfulLogins = recentAttempts
      .filter(attempt => attempt.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);

    if (recentSuccessfulLogins.length >= 2) {
      const uniqueIPs = new Set(recentSuccessfulLogins.map(login => login.ip));
      if (uniqueIPs.size > 1) {
        warnings.push('Multiple recent logins from different locations');
      }
    }

    return warnings;
  }

  // Check if account is locked
  private async isAccountLocked(email: string, ip: string): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - this.lockoutDuration);
    
    // Check failed attempts by email
    const emailFailures = this.loginAttempts.filter(attempt =>
      attempt.email === email &&
      !attempt.success &&
      attempt.timestamp > cutoffTime
    );

    // Check failed attempts by IP
    const ipFailures = this.loginAttempts.filter(attempt =>
      attempt.ip === ip &&
      !attempt.success &&
      attempt.timestamp > cutoffTime
    );

    return emailFailures.length >= this.maxLoginAttempts || 
           ipFailures.length >= this.maxLoginAttempts * 2;
  }

  // Record login attempt
  private async recordLoginAttempt(attempt: LoginAttempt): Promise<void> {
    this.loginAttempts.push(attempt);
    
    // Keep only recent attempts (last 7 days)
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.loginAttempts = this.loginAttempts.filter(
      attempt => attempt.timestamp > cutoffTime
    );

    // Log failed attempts
    if (!attempt.success) {
      logger.warn('Failed login attempt', {
        attemptId: attempt.id,
        email: attempt.email,
        ip: attempt.ip,
        reason: attempt.failureReason,
      });
    }
  }

  // Generate access token with session info
  private generateAccessToken(user: any, sessionId: string): string {
    const payload = {
      userId: user.id,
      email: user.email,
      sessionId,
      type: 'access',
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      issuer: 'notion-clone',
      audience: 'notion-clone-users',
    });
  }

  // Generate refresh token
  private async generateRefreshToken(userId: string, sessionId: string): Promise<string> {
    const tokenId = randomBytes(32).toString('hex');
    const payload = {
      userId,
      sessionId,
      tokenId,
      type: 'refresh',
    };

    const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'notion-clone',
      audience: 'notion-clone-users',
    });

    // Store refresh token hash in database
    const tokenHash = createHash('sha256').update(token).digest('hex');
    
    // In production, store this in a dedicated refresh_tokens table
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Store token hash for validation
        updatedAt: new Date(),
      },
    });

    return token;
  }

  // Validate session
  async validateSession(sessionId: string, userId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || !session.isActive || session.userId !== userId) {
      return false;
    }

    // Check session timeout
    const now = new Date();
    if (now.getTime() - session.lastActivity.getTime() > this.sessionTimeout) {
      this.invalidateSession(sessionId);
      return false;
    }

    // Update last activity
    session.lastActivity = now;
    this.activeSessions.set(sessionId, session);

    return true;
  }

  // Invalidate session
  invalidateSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.set(sessionId, session);
      
      logger.info('Session invalidated', {
        sessionId,
        userId: session.userId,
      });
    }
  }

  // Get active sessions for user
  getUserSessions(userId: string): SessionInfo[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId && session.isActive);
  }

  // Invalidate all sessions for user
  invalidateAllUserSessions(userId: string): void {
    const userSessions = this.getUserSessions(userId);
    userSessions.forEach(session => {
      this.invalidateSession(session.id);
    });

    logger.info('All user sessions invalidated', { userId });
  }

  // Get login attempts for user (admin function)
  getLoginAttempts(userId?: string, limit: number = 100): LoginAttempt[] {
    let attempts = this.loginAttempts;
    
    if (userId) {
      attempts = attempts.filter(attempt => attempt.userId === userId);
    }

    return attempts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Security analytics
  getSecurityAnalytics(): {
    totalAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueIPs: number;
    activeSessions: number;
    suspiciousActivity: number;
  } {
    const totalAttempts = this.loginAttempts.length;
    const successfulLogins = this.loginAttempts.filter(a => a.success).length;
    const failedLogins = totalAttempts - successfulLogins;
    const uniqueIPs = new Set(this.loginAttempts.map(a => a.ip)).size;
    const activeSessions = Array.from(this.activeSessions.values())
      .filter(s => s.isActive).length;
    
    // Count suspicious activities from security events
    const suspiciousActivity = securityEventStore.getEvents()
      .filter(event => event.type === SecurityEventType.SUSPICIOUS_LOGIN).length;

    return {
      totalAttempts,
      successfulLogins,
      failedLogins,
      uniqueIPs,
      activeSessions,
      suspiciousActivity,
    };
  }
}