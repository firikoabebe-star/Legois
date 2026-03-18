import { logger } from '@/utils/logger';

export interface SecurityConfig {
  authentication: {
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    maxLoginAttempts: number;
    lockoutDuration: number; // minutes
    requireEmailVerification: boolean;
    enableMFA: boolean;
  };
  security: {
    bruteForceProtection: boolean;
    sqlInjectionDetection: boolean;
    xssProtection: boolean;
    csrfProtection: boolean;
    rateLimiting: boolean;
    sessionTimeout: number; // minutes
    maxSessions: number;
  };
  compliance: {
    gdprCompliant: boolean;
    auditLogging: boolean;
    dataEncryption: boolean;
    accessControls: boolean;
    dataRetentionDays: number;
    cookieConsent: boolean;
  };
  monitoring: {
    securityEventLogging: boolean;
    loginAttemptTracking: boolean;
    sessionManagement: boolean;
    threatDetection: boolean;
    alertThresholds: {
      criticalEvents: number;
      suspiciousLogins: number;
      bruteForceAttempts: number;
    };
  };
  notifications: {
    emailAlerts: boolean;
    slackWebhook?: string;
    adminEmails: string[];
    alertCooldown: number; // minutes
  };
}

export class SecurityConfigService {
  private config: SecurityConfig;

  constructor() {
    this.config = this.getDefaultConfig();
  }

  private getDefaultConfig(): SecurityConfig {
    return {
      authentication: {
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '15'),
        requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
        enableMFA: process.env.ENABLE_MFA === 'true',
      },
      security: {
        bruteForceProtection: process.env.BRUTE_FORCE_PROTECTION !== 'false',
        sqlInjectionDetection: process.env.SQL_INJECTION_DETECTION !== 'false',
        xssProtection: process.env.XSS_PROTECTION !== 'false',
        csrfProtection: process.env.CSRF_PROTECTION !== 'false',
        rateLimiting: process.env.RATE_LIMITING !== 'false',
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1440'), // 24 hours
        maxSessions: parseInt(process.env.MAX_SESSIONS || '5'),
      },
      compliance: {
        gdprCompliant: process.env.GDPR_COMPLIANT !== 'false',
        auditLogging: process.env.AUDIT_LOGGING !== 'false',
        dataEncryption: process.env.DATA_ENCRYPTION !== 'false',
        accessControls: process.env.ACCESS_CONTROLS !== 'false',
        dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '365'),
        cookieConsent: process.env.COOKIE_CONSENT !== 'false',
      },
      monitoring: {
        securityEventLogging: process.env.SECURITY_EVENT_LOGGING !== 'false',
        loginAttemptTracking: process.env.LOGIN_ATTEMPT_TRACKING !== 'false',
        sessionManagement: process.env.SESSION_MANAGEMENT !== 'false',
        threatDetection: process.env.THREAT_DETECTION !== 'false',
        alertThresholds: {
          criticalEvents: parseInt(process.env.CRITICAL_EVENTS_THRESHOLD || '5'),
          suspiciousLogins: parseInt(process.env.SUSPICIOUS_LOGINS_THRESHOLD || '10'),
          bruteForceAttempts: parseInt(process.env.BRUTE_FORCE_THRESHOLD || '20'),
        },
      },
      notifications: {
        emailAlerts: process.env.EMAIL_ALERTS === 'true',
        slackWebhook: process.env.SLACK_WEBHOOK_URL,
        adminEmails: process.env.ADMIN_EMAILS?.split(',') || [],
        alertCooldown: parseInt(process.env.ALERT_COOLDOWN || '60'),
      },
    };
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<SecurityConfig>): SecurityConfig {
    this.config = {
      ...this.config,
      ...updates,
      authentication: {
        ...this.config.authentication,
        ...updates.authentication,
      },
      security: {
        ...this.config.security,
        ...updates.security,
      },
      compliance: {
        ...this.config.compliance,
        ...updates.compliance,
      },
      monitoring: {
        ...this.config.monitoring,
        ...updates.monitoring,
        alertThresholds: {
          ...this.config.monitoring.alertThresholds,
          ...updates.monitoring?.alertThresholds,
        },
      },
      notifications: {
        ...this.config.notifications,
        ...updates.notifications,
      },
    };

    logger.info('Security configuration updated', {
      updates,
      timestamp: new Date(),
    });

    return this.getConfig();
  }

  validateConfig(config: Partial<SecurityConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate authentication settings
    if (config.authentication) {
      const auth = config.authentication;
      
      if (auth.maxLoginAttempts && (auth.maxLoginAttempts < 1 || auth.maxLoginAttempts > 20)) {
        errors.push('Max login attempts must be between 1 and 20');
      }
      
      if (auth.lockoutDuration && (auth.lockoutDuration < 1 || auth.lockoutDuration > 1440)) {
        errors.push('Lockout duration must be between 1 and 1440 minutes');
      }
    }

    // Validate security settings
    if (config.security) {
      const security = config.security;
      
      if (security.sessionTimeout && (security.sessionTimeout < 5 || security.sessionTimeout > 10080)) {
        errors.push('Session timeout must be between 5 minutes and 7 days');
      }
      
      if (security.maxSessions && (security.maxSessions < 1 || security.maxSessions > 50)) {
        errors.push('Max sessions must be between 1 and 50');
      }
    }

    // Validate compliance settings
    if (config.compliance) {
      const compliance = config.compliance;
      
      if (compliance.dataRetentionDays && (compliance.dataRetentionDays < 1 || compliance.dataRetentionDays > 3650)) {
        errors.push('Data retention must be between 1 and 3650 days');
      }
    }

    // Validate monitoring settings
    if (config.monitoring?.alertThresholds) {
      const thresholds = config.monitoring.alertThresholds;
      
      if (thresholds.criticalEvents && (thresholds.criticalEvents < 1 || thresholds.criticalEvents > 100)) {
        errors.push('Critical events threshold must be between 1 and 100');
      }
      
      if (thresholds.suspiciousLogins && (thresholds.suspiciousLogins < 1 || thresholds.suspiciousLogins > 1000)) {
        errors.push('Suspicious logins threshold must be between 1 and 1000');
      }
      
      if (thresholds.bruteForceAttempts && (thresholds.bruteForceAttempts < 1 || thresholds.bruteForceAttempts > 1000)) {
        errors.push('Brute force attempts threshold must be between 1 and 1000');
      }
    }

    // Validate notification settings
    if (config.notifications) {
      const notifications = config.notifications;
      
      if (notifications.alertCooldown && (notifications.alertCooldown < 1 || notifications.alertCooldown > 1440)) {
        errors.push('Alert cooldown must be between 1 and 1440 minutes');
      }
      
      if (notifications.adminEmails) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = notifications.adminEmails.filter(email => !emailRegex.test(email));
        if (invalidEmails.length > 0) {
          errors.push(`Invalid admin emails: ${invalidEmails.join(', ')}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  resetToDefaults(): SecurityConfig {
    this.config = this.getDefaultConfig();
    logger.info('Security configuration reset to defaults');
    return this.getConfig();
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configJson: string): { success: boolean; errors?: string[] } {
    try {
      const importedConfig = JSON.parse(configJson) as Partial<SecurityConfig>;
      const validation = this.validateConfig(importedConfig);
      
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      this.updateConfig(importedConfig);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        errors: ['Invalid JSON format'],
      };
    }
  }

  // Get security recommendations based on current config
  getSecurityRecommendations(): string[] {
    const recommendations: string[] = [];
    const config = this.config;

    // Authentication recommendations
    if (config.authentication.maxLoginAttempts > 10) {
      recommendations.push('Consider reducing max login attempts to improve security');
    }
    
    if (!config.authentication.requireEmailVerification) {
      recommendations.push('Enable email verification to prevent fake accounts');
    }
    
    if (!config.authentication.enableMFA) {
      recommendations.push('Enable multi-factor authentication for enhanced security');
    }

    // Security recommendations
    if (config.security.sessionTimeout > 480) { // 8 hours
      recommendations.push('Consider reducing session timeout for better security');
    }
    
    if (config.security.maxSessions > 10) {
      recommendations.push('Limit concurrent sessions to prevent account sharing');
    }

    // Compliance recommendations
    if (config.compliance.dataRetentionDays > 1095) { // 3 years
      recommendations.push('Consider shorter data retention period for privacy compliance');
    }
    
    if (!config.compliance.cookieConsent) {
      recommendations.push('Enable cookie consent for GDPR compliance');
    }

    // Monitoring recommendations
    if (config.monitoring.alertThresholds.criticalEvents > 10) {
      recommendations.push('Lower critical events threshold for faster threat detection');
    }
    
    if (!config.notifications.emailAlerts) {
      recommendations.push('Enable email alerts for security incidents');
    }

    return recommendations;
  }
}

// Singleton instance
export const securityConfigService = new SecurityConfigService();