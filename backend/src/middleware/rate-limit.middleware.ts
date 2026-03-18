import rateLimit from 'express-rate-limit';
import { logger } from '@/utils/logger';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});

// Strict rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
    });
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
    });
  },
});

// More lenient rate limiting for content creation
export const contentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    error: 'Too many content requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Content rate limit exceeded', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
    });
    res.status(429).json({
      error: 'Too many content requests, please slow down.',
    });
  },
});