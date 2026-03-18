import { performance } from 'perf_hooks';
import { logger } from '@/utils/logger';
import { cacheService } from './cache.service';

export interface PerformanceMetrics {
  timestamp: number;
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  userAgent?: string;
  ip?: string;
}

export interface SystemMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
    heap: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  cpu: {
    user: number;
    system: number;
  };
  uptime: number;
  activeConnections: number;
  cacheStats: any;
}

export class PerformanceService {
  private metrics: PerformanceMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private maxMetrics = 10000;
  private startTime = Date.now();
  private activeConnections = 0;
  private cpuUsageStart: NodeJS.CpuUsage;

  constructor() {
    this.cpuUsageStart = process.cpuUsage();
    this.startSystemMonitoring();
  }

  // Record request performance metrics
  recordRequestMetrics(metrics: Omit<PerformanceMetrics, 'timestamp' | 'memoryUsage'>): void {
    const metric: PerformanceMetrics = {
      ...metrics,
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(this.cpuUsageStart),
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests
    if (metrics.duration > 1000) { // > 1 second
      logger.warn('Slow request detected', {
        endpoint: metrics.endpoint,
        method: metrics.method,
        duration: metrics.duration,
        statusCode: metrics.statusCode,
      });
    }

    // Cache recent metrics for dashboard
    this.cacheRecentMetrics();
  }

  // Get performance analytics
  getAnalytics(timeRange: number = 3600000): { // Default 1 hour
    requests: {
      total: number;
      successful: number;
      failed: number;
      averageResponseTime: number;
      slowestRequests: PerformanceMetrics[];
      requestsByEndpoint: { [endpoint: string]: number };
      requestsByStatus: { [status: string]: number };
    };
    system: {
      averageMemoryUsage: number;
      peakMemoryUsage: number;
      averageCpuUsage: number;
      uptime: number;
    };
  } {
    const cutoffTime = Date.now() - timeRange;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    const recentSystemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoffTime);

    // Request analytics
    const total = recentMetrics.length;
    const successful = recentMetrics.filter(m => m.statusCode < 400).length;
    const failed = total - successful;
    const averageResponseTime = total > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / total 
      : 0;

    const slowestRequests = recentMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const requestsByEndpoint = recentMetrics.reduce((acc, m) => {
      acc[m.endpoint] = (acc[m.endpoint] || 0) + 1;
      return acc;
    }, {} as { [endpoint: string]: number });

    const requestsByStatus = recentMetrics.reduce((acc, m) => {
      const statusGroup = `${Math.floor(m.statusCode / 100)}xx`;
      acc[statusGroup] = (acc[statusGroup] || 0) + 1;
      return acc;
    }, {} as { [status: string]: number });

    // System analytics
    const averageMemoryUsage = recentSystemMetrics.length > 0
      ? recentSystemMetrics.reduce((sum, m) => sum + m.memory.percentage, 0) / recentSystemMetrics.length
      : 0;

    const peakMemoryUsage = recentSystemMetrics.length > 0
      ? Math.max(...recentSystemMetrics.map(m => m.memory.percentage))
      : 0;

    const averageCpuUsage = recentSystemMetrics.length > 0
      ? recentSystemMetrics.reduce((sum, m) => sum + m.cpu.user + m.cpu.system, 0) / recentSystemMetrics.length
      : 0;

    return {
      requests: {
        total,
        successful,
        failed,
        averageResponseTime,
        slowestRequests,
        requestsByEndpoint,
        requestsByStatus,
      },
      system: {
        averageMemoryUsage,
        peakMemoryUsage,
        averageCpuUsage,
        uptime: Date.now() - this.startTime,
      },
    };
  }

  // Get real-time system metrics
  getCurrentSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.cpuUsageStart);
    
    return {
      timestamp: Date.now(),
      memory: {
        used: memoryUsage.rss,
        total: memoryUsage.rss + memoryUsage.external,
        percentage: (memoryUsage.rss / (memoryUsage.rss + memoryUsage.external)) * 100,
        heap: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        },
      },
      cpu: {
        user: cpuUsage.user / 1000000, // Convert to seconds
        system: cpuUsage.system / 1000000,
      },
      uptime: process.uptime(),
      activeConnections: this.activeConnections,
      cacheStats: null, // Will be populated by cache service
    };
  }

  // Performance monitoring middleware
  createPerformanceMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = performance.now();
      this.activeConnections++;

      // Override res.end to capture metrics
      const originalEnd = res.end;
      res.end = (...args: any[]) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordRequestMetrics({
          endpoint: req.route?.path || req.path || req.url,
          method: req.method,
          duration,
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });

        this.activeConnections--;
        return originalEnd.apply(res, args);
      };

      next();
    };
  }

  // Database query performance tracking
  async trackDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;

      // Log slow queries
      if (duration > 100) { // > 100ms
        logger.warn('Slow database query', {
          queryName,
          duration,
        });
      }

      // Cache query performance for analytics
      await cacheService.set(
        `db_query_perf:${queryName}:${Date.now()}`,
        { duration, timestamp: Date.now() },
        { ttl: 3600, prefix: 'performance' }
      );

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Database query error', error as Error, {
        queryName,
        duration,
      });
      throw error;
    }
  }

  // Cache performance tracking
  async trackCacheOperation<T>(
    operation: string,
    operationFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operationFn();
      const duration = performance.now() - startTime;

      // Log slow cache operations
      if (duration > 50) { // > 50ms
        logger.warn('Slow cache operation', {
          operation,
          duration,
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Cache operation error', error as Error, {
        operation,
        duration,
      });
      throw error;
    }
  }

  // Memory usage monitoring
  checkMemoryUsage(): {
    usage: NodeJS.MemoryUsage;
    isHigh: boolean;
    recommendations: string[];
  } {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    const heapTotalMB = usage.heapTotal / 1024 / 1024;
    const rssMB = usage.rss / 1024 / 1024;
    
    const isHigh = heapUsedMB > 500 || rssMB > 1000; // 500MB heap or 1GB RSS
    const recommendations: string[] = [];

    if (isHigh) {
      recommendations.push('Consider implementing memory optimization strategies');
      
      if (heapUsedMB > 500) {
        recommendations.push('Heap usage is high - check for memory leaks');
      }
      
      if (rssMB > 1000) {
        recommendations.push('RSS memory is high - consider scaling horizontally');
      }
    }

    return {
      usage,
      isHigh,
      recommendations,
    };
  }

  // Performance recommendations
  getPerformanceRecommendations(): string[] {
    const analytics = this.getAnalytics();
    const recommendations: string[] = [];

    // Response time recommendations
    if (analytics.requests.averageResponseTime > 500) {
      recommendations.push('Average response time is high - consider caching or optimization');
    }

    // Error rate recommendations
    const errorRate = analytics.requests.total > 0 
      ? (analytics.requests.failed / analytics.requests.total) * 100 
      : 0;
    
    if (errorRate > 5) {
      recommendations.push('Error rate is high - investigate failing requests');
    }

    // Memory recommendations
    if (analytics.system.averageMemoryUsage > 80) {
      recommendations.push('Memory usage is high - consider memory optimization');
    }

    // CPU recommendations
    if (analytics.system.averageCpuUsage > 70) {
      recommendations.push('CPU usage is high - consider performance optimization');
    }

    return recommendations;
  }

  // Start system monitoring
  private startSystemMonitoring(): void {
    setInterval(async () => {
      const metrics = this.getCurrentSystemMetrics();
      
      // Add cache stats
      try {
        metrics.cacheStats = await cacheService.getStats();
      } catch (error) {
        logger.error('Failed to get cache stats', error as Error);
      }

      this.systemMetrics.push(metrics);

      // Keep only recent system metrics
      if (this.systemMetrics.length > 1000) {
        this.systemMetrics = this.systemMetrics.slice(-1000);
      }

      // Alert on high resource usage
      if (metrics.memory.percentage > 90) {
        logger.warn('High memory usage detected', {
          percentage: metrics.memory.percentage,
          used: metrics.memory.used,
        });
      }

      if (metrics.cpu.user + metrics.cpu.system > 80) {
        logger.warn('High CPU usage detected', {
          user: metrics.cpu.user,
          system: metrics.cpu.system,
        });
      }
    }, 30000); // Every 30 seconds
  }

  // Cache recent metrics for dashboard
  private async cacheRecentMetrics(): void {
    try {
      const recentMetrics = this.metrics.slice(-100); // Last 100 requests
      await cacheService.set(
        'recent_metrics',
        recentMetrics,
        { ttl: 300, prefix: 'performance' } // 5 minutes
      );
    } catch (error) {
      logger.error('Failed to cache recent metrics', error as Error);
    }
  }

  // Export metrics for external monitoring
  exportMetrics(): {
    requests: PerformanceMetrics[];
    system: SystemMetrics[];
    analytics: ReturnType<typeof this.getAnalytics>;
  } {
    return {
      requests: this.metrics,
      system: this.systemMetrics,
      analytics: this.getAnalytics(),
    };
  }

  // Clear old metrics
  clearOldMetrics(olderThan: number = 86400000): void { // Default 24 hours
    const cutoffTime = Date.now() - olderThan;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoffTime);
  }
}

// Singleton instance
export const performanceService = new PerformanceService();