import { Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';
import { performanceService } from '@/services/performance.service';
import { cacheService } from '@/services/cache.service';

// Get performance analytics
export const getPerformanceAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const timeRange = parseInt(req.query.timeRange as string) || 3600000; // Default 1 hour
  const analytics = performanceService.getAnalytics(timeRange);
  
  res.json({
    success: true,
    data: { analytics },
  });
});

// Get real-time system metrics
export const getSystemMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const metrics = performanceService.getCurrentSystemMetrics();
  
  // Add cache stats
  try {
    metrics.cacheStats = await cacheService.getStats();
  } catch (error) {
    metrics.cacheStats = { error: 'Failed to get cache stats' };
  }
  
  res.json({
    success: true,
    data: { metrics },
  });
});

// Get performance recommendations
export const getPerformanceRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const recommendations = performanceService.getPerformanceRecommendations();
  const memoryCheck = performanceService.checkMemoryUsage();
  
  res.json({
    success: true,
    data: {
      recommendations,
      memoryCheck,
    },
  });
});

// Get cache statistics
export const getCacheStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await cacheService.getStats();
  
  res.json({
    success: true,
    data: { stats },
  });
});

// Clear cache
export const clearCache = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { prefix } = req.body;
  
  const success = await cacheService.flush(prefix);
  
  res.json({
    success,
    message: prefix ? `Cache cleared for prefix: ${prefix}` : 'All cache cleared',
  });
});

// Warm up cache
export const warmUpCache = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { keys } = req.body;
  
  if (!Array.isArray(keys)) {
    return res.status(400).json({
      success: false,
      error: 'Keys must be an array',
    });
  }

  const results = await Promise.allSettled(
    keys.map(async (key: string) => {
      // This would typically involve pre-loading data into cache
      // For now, we'll just check if the key exists
      return await cacheService.exists(key);
    })
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  
  res.json({
    success: true,
    message: `Cache warm-up completed: ${successful}/${keys.length} keys processed`,
    data: {
      total: keys.length,
      successful,
      failed: keys.length - successful,
    },
  });
});

// Export performance metrics
export const exportMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const format = req.query.format as string || 'json';
  const metrics = performanceService.exportMetrics();
  
  if (format === 'csv') {
    // Convert to CSV format
    const csvData = convertMetricsToCSV(metrics);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="performance-metrics-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvData);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="performance-metrics-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(metrics);
  }
});

// Database performance analysis
export const getDatabasePerformance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Get cached database query performance data
  const queryPerformance = await cacheService.get('db_query_performance', { prefix: 'performance' });
  
  res.json({
    success: true,
    data: {
      queryPerformance: queryPerformance || {
        message: 'No database performance data available',
        suggestion: 'Run some database operations to collect performance data',
      },
    },
  });
});

// Memory analysis
export const getMemoryAnalysis = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const memoryCheck = performanceService.checkMemoryUsage();
  
  // Force garbage collection if available (only in development)
  let gcStats = null;
  if (process.env.NODE_ENV === 'development' && global.gc) {
    const beforeGC = process.memoryUsage();
    global.gc();
    const afterGC = process.memoryUsage();
    
    gcStats = {
      before: beforeGC,
      after: afterGC,
      freed: {
        rss: beforeGC.rss - afterGC.rss,
        heapUsed: beforeGC.heapUsed - afterGC.heapUsed,
        heapTotal: beforeGC.heapTotal - afterGC.heapTotal,
      },
    };
  }
  
  res.json({
    success: true,
    data: {
      current: memoryUsage,
      analysis: memoryCheck,
      gcStats,
      recommendations: memoryCheck.recommendations,
    },
  });
});

// Performance optimization suggestions
export const getOptimizationSuggestions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const analytics = performanceService.getAnalytics();
  const memoryCheck = performanceService.checkMemoryUsage();
  const cacheStats = await cacheService.getStats();
  
  const suggestions: Array<{
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    suggestion: string;
    impact: string;
  }> = [];

  // Response time suggestions
  if (analytics.requests.averageResponseTime > 1000) {
    suggestions.push({
      category: 'Response Time',
      priority: 'high',
      suggestion: 'Implement caching for frequently accessed data',
      impact: 'Reduce average response time by 50-80%',
    });
  }

  if (analytics.requests.averageResponseTime > 500) {
    suggestions.push({
      category: 'Response Time',
      priority: 'medium',
      suggestion: 'Optimize database queries and add indexes',
      impact: 'Reduce response time by 20-40%',
    });
  }

  // Memory suggestions
  if (memoryCheck.isHigh) {
    suggestions.push({
      category: 'Memory',
      priority: 'critical',
      suggestion: 'Investigate memory leaks and optimize data structures',
      impact: 'Prevent out-of-memory errors and improve stability',
    });
  }

  // Cache suggestions
  if (cacheStats.type === 'memory' && cacheStats.keyCount > 1000) {
    suggestions.push({
      category: 'Caching',
      priority: 'medium',
      suggestion: 'Consider using Redis for better cache performance',
      impact: 'Improve cache performance and enable distributed caching',
    });
  }

  // Error rate suggestions
  const errorRate = analytics.requests.total > 0 
    ? (analytics.requests.failed / analytics.requests.total) * 100 
    : 0;
    
  if (errorRate > 5) {
    suggestions.push({
      category: 'Error Handling',
      priority: 'high',
      suggestion: 'Investigate and fix failing requests',
      impact: 'Improve user experience and system reliability',
    });
  }

  // Database suggestions
  const slowEndpoints = Object.entries(analytics.requests.requestsByEndpoint)
    .filter(([endpoint, count]) => count > 10)
    .map(([endpoint]) => endpoint);

  if (slowEndpoints.length > 0) {
    suggestions.push({
      category: 'Database',
      priority: 'medium',
      suggestion: 'Add database indexes for frequently queried endpoints',
      impact: 'Reduce database query time by 30-60%',
    });
  }

  res.json({
    success: true,
    data: {
      suggestions: suggestions.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      analytics: {
        responseTime: analytics.requests.averageResponseTime,
        errorRate,
        memoryUsage: memoryCheck.usage.heapUsed / 1024 / 1024, // MB
        cacheType: cacheStats.type,
      },
    },
  });
});

// Helper function to convert metrics to CSV
function convertMetricsToCSV(metrics: any): string {
  const headers = [
    'timestamp',
    'endpoint',
    'method',
    'duration',
    'statusCode',
    'memoryUsed',
    'cpuUser',
    'cpuSystem',
  ];

  const rows = metrics.requests.map((metric: any) => [
    new Date(metric.timestamp).toISOString(),
    metric.endpoint,
    metric.method,
    metric.duration,
    metric.statusCode,
    metric.memoryUsage.heapUsed,
    metric.cpuUsage?.user || 0,
    metric.cpuUsage?.system || 0,
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}