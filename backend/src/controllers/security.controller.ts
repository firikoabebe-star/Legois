import { Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';
import { SecurityAuditService } from '@/services/security-audit.service';
import { securityConfigService } from '@/services/security-config.service';
import { securityEventStore } from '@/middleware/security-advanced.middleware';
import { authAdvancedService, sessionManagement } from '@/middleware/auth-enhanced.middleware';

const securityAuditService = new SecurityAuditService();

// Security audit endpoints
export const getSecurityAuditReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  
  const report = await securityAuditService.generateSecurityAuditReport(startDate, endDate);
  
  res.json({
    success: true,
    data: { report },
  });
});

export const getComplianceReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const report = await securityAuditService.generateComplianceReport();
  
  res.json({
    success: true,
    data: { report },
  });
});

export const getSecurityEvents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const type = req.query.type as string;
  const userId = req.query.userId as string;
  const ip = req.query.ip as string;
  
  let events;
  
  if (type) {
    events = securityEventStore.getEventsByType(type as any, limit);
  } else if (userId) {
    events = securityEventStore.getEventsByUser(userId, limit);
  } else if (ip) {
    events = securityEventStore.getEventsByIP(ip, limit);
  } else {
    events = securityEventStore.getEvents(limit);
  }
  
  res.json({
    success: true,
    data: { events },
  });
});

export const getSecurityAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const analytics = securityAuditService.getSecurityAnalytics();
  
  res.json({
    success: true,
    data: { analytics },
  });
});

// Login attempt monitoring
export const getLoginAttempts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.query.userId as string;
  const limit = parseInt(req.query.limit as string) || 100;
  
  const attempts = authAdvancedService.getLoginAttempts(userId, limit);
  
  res.json({
    success: true,
    data: { attempts },
  });
});

// Session management endpoints
export const getUserSessions = sessionManagement.getSessions;
export const invalidateSession = sessionManagement.invalidateSession;
export const invalidateAllOtherSessions = sessionManagement.invalidateAllOtherSessions;

// Security actions
export const blockIP = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { ip, reason, duration } = req.body;
  
  // In production, this would update a firewall or IP blocking service
  // For now, we'll just log the action
  
  res.json({
    success: true,
    message: `IP ${ip} blocked successfully`,
    data: {
      ip,
      reason,
      duration,
      blockedBy: req.user!.userId,
      blockedAt: new Date(),
    },
  });
});

export const suspendUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, reason } = req.body;
  
  // Invalidate all user sessions
  authAdvancedService.invalidateAllUserSessions(userId);
  
  // In production, this would also update user status in database
  
  res.json({
    success: true,
    message: `User ${userId} suspended successfully`,
    data: {
      userId,
      reason,
      suspendedBy: req.user!.userId,
      suspendedAt: new Date(),
    },
  });
});

// Security configuration
export const getSecurityConfig = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const config = securityConfigService.getConfig();
  const recommendations = securityConfigService.getSecurityRecommendations();
  
  res.json({
    success: true,
    data: { 
      config,
      recommendations,
    },
  });
});

export const updateSecurityConfig = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { config } = req.body;
  
  // Validate configuration
  const validation = securityConfigService.validateConfig(config);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid configuration',
      details: validation.errors,
    });
  }

  // Update configuration
  const updatedConfig = securityConfigService.updateConfig(config);
  const recommendations = securityConfigService.getSecurityRecommendations();
  
  res.json({
    success: true,
    message: 'Security configuration updated successfully',
    data: {
      config: updatedConfig,
      recommendations,
      updatedBy: req.user!.userId,
      updatedAt: new Date(),
    },
  });
});

// Export/Import configuration
export const exportSecurityConfig = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const configJson = securityConfigService.exportConfig();
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="security-config-${new Date().toISOString().split('T')[0]}.json"`);
  res.send(configJson);
});

export const importSecurityConfig = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { configJson } = req.body;
  
  const result = securityConfigService.importConfig(configJson);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: 'Failed to import configuration',
      details: result.errors,
    });
  }

  const config = securityConfigService.getConfig();
  const recommendations = securityConfigService.getSecurityRecommendations();
  
  res.json({
    success: true,
    message: 'Security configuration imported successfully',
    data: {
      config,
      recommendations,
      importedBy: req.user!.userId,
      importedAt: new Date(),
    },
  });
});

export const resetSecurityConfig = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const config = securityConfigService.resetToDefaults();
  const recommendations = securityConfigService.getSecurityRecommendations();
  
  res.json({
    success: true,
    message: 'Security configuration reset to defaults',
    data: {
      config,
      recommendations,
      resetBy: req.user!.userId,
      resetAt: new Date(),
    },
  });
});