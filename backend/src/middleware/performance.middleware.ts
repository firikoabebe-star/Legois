import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { logger } from '@/utils/logger';
import { performanceService } from '@/services/performance.service';
import { cacheService } from '@/services/cache.service';

// Request timing middleware
export const requestTiming = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  req.startTime = startTime;

  // Override res.end to capture timing
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Add timing header
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
      });
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Memory monitoring middleware
export const memoryMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const memoryBefore = process.memoryUsage();

  res.on('finish', () => {
    const memoryAfter = process.memoryUsage();
    const memoryDiff = {
      rss: memoryAfter.rss - memoryBefore.rss,
      heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
      heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
      external: memoryAfter.external - memoryBefore.external,
    };

    // Log significant memory increases
    if (memoryDiff.heapUsed > 10 * 1024 * 1024) { // > 10MB
      logger.warn('High memory usage increase', {
        method: req.method,
        url: req.originalUrl,
        memoryIncrease: `${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      });
    }
  });

  next();
};

// Database query optimization middleware
export const queryOptimization = (req: Request, res: Response, next: NextFunction) => {
  // Track database queries for this request
  const queries: Array<{ query: string; duration: number }> = [];
  
  // Monkey patch Prisma client if available
  if ((global as any).prisma) {
    const originalQuery = (global as any).prisma.$queryRaw;
    (global as any).prisma.$queryRaw = async (...args: any[]) => {
      const startTime = performance.now();
      const result = await originalQuery.apply((global as any).prisma, args);
      const duration = performance.now() - startTime;
      
      queries.push({
        query: args[0]?.toString() || 'unknown',
        duration,
      });

      return result;
    };
  }

  res.on('finish', () => {
    if (queries.length > 0) {
      const totalQueryTime = queries.reduce((sum, q) => sum + q.duration, 0);
      const slowQueries = queries.filter(q => q.duration > 100);

      if (slowQueries.length > 0) {
        logger.warn('Slow database queries detected', {
          method: req.method,
          url: req.originalUrl,
          totalQueries: queries.length,
          slowQueries: slowQueries.length,
          totalQueryTime: `${totalQueryTime.toFixed(2)}ms`,
        });
      }
    }
  });

  next();
};

// Cache hit rate monitoring
export const cacheMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const cacheOperations: Array<{ operation: string; hit: boolean; duration: number }> = [];

  // Track cache operations
  const originalGet = cacheService.get;
  const originalSet = cacheService.set;

  cacheService.get = async function(key: string, options?: any) {
    const startTime = performance.now();
    const result = await originalGet.call(this, key, options);
    const duration = performance.now() - startTime;

    cacheOperations.push({
      operation: 'get',
      hit: result !== null,
      duration,
    });

    return result;
  };

  cacheService.set = async function(key: string, value: any, options?: any) {
    const startTime = performance.now();
    const result = await originalSet.call(this, key, value, options);
    const duration = performance.now() - startTime;

    cacheOperations.push({
      operation: 'set',
      hit: true,
      duration,
    });

    return result;
  };

  res.on('finish', () => {
    if (cacheOperations.length > 0) {
      const hits = cacheOperations.filter(op => op.hit && op.operation === 'get').length;
      const gets = cacheOperations.filter(op => op.operation === 'get').length;
      const hitRate = gets > 0 ? (hits / gets) * 100 : 0;

      // Log low cache hit rates
      if (gets > 0 && hitRate < 50) {
        logger.warn('Low cache hit rate', {
          method: req.method,
          url: req.originalUrl,
          hitRate: `${hitRate.toFixed(2)}%`,
          operations: cacheOperations.length,
        });
      }
    }

    // Restore original methods
    cacheService.get = originalGet;
    cacheService.set = originalSet;
  });

  next();
};

// Response compression monitoring
export const compressionMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const originalWrite = res.write;
  const originalEnd = res.end;
  let uncompressedSize = 0;

  res.write = function(chunk: any, encoding?: any) {
    if (chunk) {
      uncompressedSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, encoding);
    }
    return originalWrite.call(this, chunk, encoding);
  };

  res.end = function(chunk?: any, encoding?: any) {
    if (chunk) {
      uncompressedSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, encoding);
    }

    const compressedSize = parseInt(res.getHeader('content-length') as string) || uncompressedSize;
    const compressionRatio = uncompressedSize > 0 ? (1 - compressedSize / uncompressedSize) * 100 : 0;

    // Add compression headers
    res.setHeader('X-Uncompressed-Size', uncompressedSize);
    res.setHeader('X-Compression-Ratio', `${compressionRatio.toFixed(2)}%`);

    // Log poor compression ratios for large responses
    if (uncompressedSize > 10000 && compressionRatio < 20) { // > 10KB and < 20% compression
      logger.warn('Poor compression ratio', {
        method: req.method,
        url: req.originalUrl,
        uncompressedSize,
        compressedSize,
        compressionRatio: `${compressionRatio.toFixed(2)}%`,
      });
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Request size monitoring
export const requestSizeMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');

  // Log large requests
  if (contentLength > 1024 * 1024) { // > 1MB
    logger.warn('Large request detected', {
      method: req.method,
      url: req.originalUrl,
      size: `${(contentLength / 1024 / 1024).toFixed(2)}MB`,
      contentType: req.headers['content-type'],
    });
  }

  next();
};

// Connection monitoring
export const connectionMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const connectionStart = Date.now();

  res.on('close', () => {
    const connectionDuration = Date.now() - connectionStart;
    
    // Log long-lived connections
    if (connectionDuration > 30000) { // > 30 seconds
      logger.warn('Long-lived connection', {
        method: req.method,
        url: req.originalUrl,
        duration: `${connectionDuration}ms`,
        userAgent: req.headers['user-agent'],
      });
    }
  });

  next();
};

// Performance middleware factory
export const createPerformanceMiddleware = () => {
  return performanceService.createPerformanceMiddleware();
};

// Health check middleware
export const healthCheck = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health' || req.path === '/api/health') {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)} minutes`,
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        percentage: `${Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)}%`,
      },
      environment: process.env.NODE_ENV || 'development',
    };

    return res.json(health);
  }

  next();
};

// Performance alert middleware
export const performanceAlerts = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();

  res.on('finish', () => {
    const duration = performance.now() - startTime;
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;

    // Critical performance alerts
    if (duration > 5000) { // > 5 seconds
      logger.error('Critical response time', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
      });
    }

    if (heapUsedMB > 1000) { // > 1GB heap usage
      logger.error('Critical memory usage', {
        heapUsed: `${heapUsedMB.toFixed(2)}MB`,
        method: req.method,
        url: req.originalUrl,
      });
    }
  });

  next();
};