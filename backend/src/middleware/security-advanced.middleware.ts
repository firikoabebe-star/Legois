import { Request, Response, NextFunction } from 'express';
import { createHash, randomBytes } from 'crypto';
import { logger } from '@/utils/logger';

// Security event types
export enum SecurityEventType {
  SUSPICIOUS_LOGIN = 'suspicious_login',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_token',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
}

interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip: string;
  userAgent: string;
  details: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// In-memory security event store (use Redis in production)
class SecurityEventStore {
  private events: SecurityEvent[] = [];
  private maxEvents = 10000;

  addEvent(event: SecurityEvent): void {
    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log critical events immediately
    if (event.severity === 'critical') {
      logger.error('Critical security event', event);
      // In production, send alerts to security team
    }
  }

  getEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  getEventsByType(type: SecurityEventType, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit);
  }

  getEventsByUser(userId: string, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.userId === userId)
      .slice(-limit);
  }

  getEventsByIP(ip: string, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.ip === ip)
      .slice(-limit);
  }
}

const securityEventStore = new SecurityEventStore();

// Brute force protection
class BruteForceProtection {
  private attempts = new Map<string, { count: number; lastAttempt: Date; blocked: boolean }>();
  private maxAttempts = 5;
  private blockDuration = 15 * 60 * 1000; // 15 minutes
  private windowDuration = 5 * 60 * 1000; // 5 minutes

  recordAttempt(identifier: string, success: boolean): boolean {
    const now = new Date();
    const record = this.attempts.get(identifier) || { count: 0, lastAttempt: now, blocked: false };

    // Reset if window expired
    if (now.getTime() - record.lastAttempt.getTime() > this.windowDuration) {
      record.count = 0;
      record.blocked = false;
    }

    // Check if still blocked
    if (record.blocked && now.getTime() - record.lastAttempt.getTime() < this.blockDuration) {
      return false; // Still blocked
    }

    if (success) {
      // Reset on successful attempt
      this.attempts.delete(identifier);
      return true;
    }

    // Increment failed attempts
    record.count++;
    record.lastAttempt = now;

    if (record.count >= this.maxAttempts) {
      record.blocked = true;
      
      // Log security event
      securityEventStore.addEvent({
        type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
        ip: identifier,
        userAgent: 'unknown',
        details: { attempts: record.count },
        timestamp: now,
        severity: 'high',
      });
    }

    this.attempts.set(identifier, record);
    return !record.blocked;
  }

  isBlocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record || !record.blocked) return false;

    const now = new Date();
    if (now.getTime() - record.lastAttempt.getTime() > this.blockDuration) {
      record.blocked = false;
      this.attempts.set(identifier, record);
      return false;
    }

    return true;
  }
}

const bruteForceProtection = new BruteForceProtection();

// SQL Injection detection
export const sqlInjectionDetection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\'|\"|;|--|\*|\|)/,
    /(\b(WAITFOR|DELAY)\b)/i,
    /(\b(XP_|SP_)\w+)/i,
  ];

  const checkForSQLInjection = (value: string): boolean => {
    return sqlPatterns.some(pattern => pattern.test(value));
  };

  const checkObject = (obj: any, path: string = ''): boolean => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string' && checkForSQLInjection(value)) {
        securityEventStore.addEvent({
          type: SecurityEventType.SQL_INJECTION_ATTEMPT,
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          details: { path: currentPath, value, url: req.originalUrl },
          timestamp: new Date(),
          severity: 'critical',
        });
        return true;
      }
      
      if (typeof value === 'object' && value !== null) {
        if (checkObject(value, currentPath)) return true;
      }
    }
    return false;
  };

  // Check query parameters
  if (req.query && checkObject(req.query, 'query')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request parameters',
    });
  }

  // Check request body
  if (req.body && checkObject(req.body, 'body')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request data',
    });
  }

  next();
};

// XSS detection and prevention
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  ];

  const sanitizeValue = (value: string): string => {
    let sanitized = value;
    xssPatterns.forEach(pattern => {
      if (pattern.test(sanitized)) {
        securityEventStore.addEvent({
          type: SecurityEventType.XSS_ATTEMPT,
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          details: { value, url: req.originalUrl },
          timestamp: new Date(),
          severity: 'high',
        });
      }
      sanitized = sanitized.replace(pattern, '');
    });
    return sanitized;
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeValue(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Brute force protection middleware
export const bruteForceProtectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const identifier = req.ip || 'unknown';
  
  if (bruteForceProtection.isBlocked(identifier)) {
    securityEventStore.addEvent({
      type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
      ip: identifier,
      userAgent: req.get('User-Agent') || 'unknown',
      details: { url: req.originalUrl, blocked: true },
      timestamp: new Date(),
      severity: 'high',
    });

    return res.status(429).json({
      success: false,
      error: 'Too many failed attempts. Please try again later.',
      retryAfter: 900, // 15 minutes
    });
  }

  // Store original end method to capture response status
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const success = res.statusCode < 400;
    bruteForceProtection.recordAttempt(identifier, success);
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Content Security Policy nonce generation
export const generateCSPNonce = (req: Request, res: Response, next: NextFunction) => {
  const nonce = randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;
  
  // Set CSP header with nonce
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;`
  );
  
  next();
};

// Privilege escalation detection
export const privilegeEscalationDetection = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) return next();

  // Check for suspicious role changes or admin access attempts
  const suspiciousPatterns = [
    /admin/i,
    /root/i,
    /superuser/i,
    /privilege/i,
    /escalate/i,
  ];

  const checkForPrivilegeEscalation = (obj: any): boolean => {
    const str = JSON.stringify(obj).toLowerCase();
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };

  if (req.body && checkForPrivilegeEscalation(req.body)) {
    securityEventStore.addEvent({
      type: SecurityEventType.PRIVILEGE_ESCALATION,
      userId: user.userId,
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      details: { body: req.body, url: req.originalUrl },
      timestamp: new Date(),
      severity: 'critical',
    });

    logger.warn('Privilege escalation attempt detected', {
      userId: user.userId,
      ip: req.ip,
      url: req.originalUrl,
    });
  }

  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Generate nonce for inline scripts
  const nonce = randomBytes(16).toString('base64');
  res.locals.nonce = nonce;

  // Set comprehensive security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  
  // HSTS header for HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

// Export security event store for admin access
export { securityEventStore, bruteForceProtection, SecurityEvent };