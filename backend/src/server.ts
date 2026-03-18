import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

import routes from '@/routes';
import { errorHandler, notFoundHandler } from '@/middleware/error.middleware';
import { generalLimiter } from '@/middleware/rate-limit.middleware';
import { compressionMiddleware } from '@/middleware/compression.middleware';
import { securityMiddleware, additionalSecurityHeaders, sanitizeRequest } from '@/middleware/security.middleware';
import { monitoringMiddleware, getHealthMetrics } from '@/middleware/monitoring.middleware';
import { 
  sqlInjectionDetection, 
  xssProtection, 
  bruteForceProtectionMiddleware,
  securityHeaders 
} from '@/middleware/security-advanced.middleware';
import { 
  requestTiming,
  memoryMonitoring,
  createPerformanceMiddleware,
  healthCheck,
  performanceAlerts,
} from '@/middleware/performance.middleware';
import { cacheService } from '@/services/cache.service';
import { performanceService } from '@/services/performance.service';
import { logger } from '@/utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Enhanced security middleware
app.use(securityMiddleware);
app.use(additionalSecurityHeaders);
app.use(securityHeaders);
app.use(sanitizeRequest);

// Advanced security middleware
app.use(sqlInjectionDetection);
app.use(xssProtection);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Enhanced compression middleware
app.use(compressionMiddleware);

// Performance monitoring middleware
app.use(requestTiming);
app.use(memoryMonitoring);
app.use(createPerformanceMiddleware());
app.use(performanceAlerts);

// Health check middleware (before other routes)
app.use(healthCheck);

// Monitoring middleware
app.use(monitoringMiddleware);

// Request parsing
app.use(express.json({ 
  limit: process.env.MAX_FILE_SIZE || '10mb',
  strict: true,
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_FILE_SIZE || '10mb',
}));

// Enhanced logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  }));
}

// Rate limiting with brute force protection
app.use('/api/auth', bruteForceProtectionMiddleware);
app.use('/api', generalLimiter);

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Notion Clone API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    docs: '/api/health',
  });
});

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const healthData = getHealthMetrics();
  res.json(healthData);
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
  });

  // Initialize performance monitoring
  cacheService.startCleanupInterval();
  
  logger.info('Performance monitoring initialized');
});

export default app;