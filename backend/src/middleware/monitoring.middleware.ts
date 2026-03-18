import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

interface RequestMetrics {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip: string;
  userId?: string;
  timestamp: Date;
}

// In-memory metrics storage (in production, use a proper metrics system)
class MetricsCollector {
  private metrics: RequestMetrics[] = [];
  private maxMetrics = 10000; // Keep last 10k requests

  addMetric(metric: RequestMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(): RequestMetrics[] {
    return [...this.metrics];
  }

  getStats(): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    topEndpoints: { url: string; count: number }[];
    statusCodes: { [key: number]: number };
  } {
    const total = this.metrics.length;
    
    if (total === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        topEndpoints: [],
        statusCodes: {},
      };
    }

    // Calculate average response time
    const avgResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / total;

    // Calculate error rate
    const errors = this.metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errors / total) * 100;

    // Get top endpoints
    const endpointCounts = this.metrics.reduce((acc, m) => {
      const key = `${m.method} ${m.url}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([url, count]) => ({ url, count }));

    // Get status code distribution
    const statusCodes = this.metrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    return {
      totalRequests: total,
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      topEndpoints,
      statusCodes,
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

const metricsCollector = new MetricsCollector();

// Request monitoring middleware
export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Store original end method
  const originalEnd = res.end;
  
  // Override end method to capture metrics
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    // Collect metrics
    const metric: RequestMetrics = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userId: (req as any).user?.userId,
      timestamp: new Date(),
    };
    
    metricsCollector.addMetric(metric);
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        responseTime,
        statusCode: res.statusCode,
        userId: (req as any).user?.userId,
      });
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      logger.error('Request error', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime,
        userId: (req as any).user?.userId,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    }
    
    // Add performance headers
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Health check endpoint data
export const getHealthMetrics = () => {
  const stats = metricsCollector.getStats();
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    },
    requests: stats,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
  };
};

// Performance monitoring for database queries
export const dbQueryMonitor = (queryName: string) => {
  return {
    start: () => {
      const startTime = Date.now();
      
      return {
        end: () => {
          const duration = Date.now() - startTime;
          
          if (duration > 500) {
            logger.warn('Slow database query', {
              queryName,
              duration,
            });
          }
          
          return duration;
        },
      };
    },
  };
};

// Export metrics collector for admin dashboard
export { metricsCollector };