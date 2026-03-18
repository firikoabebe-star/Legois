"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Clock,
  Database,
  HardDrive,
  Cpu,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface PerformanceAnalytics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
    slowestRequests: Array<{
      endpoint: string;
      method: string;
      duration: number;
      statusCode: number;
    }>;
    requestsByEndpoint: { [endpoint: string]: number };
    requestsByStatus: { [status: string]: number };
  };
  system: {
    averageMemoryUsage: number;
    peakMemoryUsage: number;
    averageCpuUsage: number;
    uptime: number;
  };
}

interface SystemMetrics {
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
  cacheStats: {
    type: string;
    connected: boolean;
    keyCount: number;
    memoryUsage?: string;
  };
}

interface OptimizationSuggestion {
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  suggestion: string;
  impact: string;
}

export function PerformanceDashboard() {
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(
    null,
  );
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchPerformanceData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchPerformanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setIsRefreshing(true);

      const [analyticsRes, metricsRes, suggestionsRes] = await Promise.all([
        apiClient.get<{ analytics: PerformanceAnalytics }>(
          "/performance/analytics",
        ),
        apiClient.get<{ metrics: SystemMetrics }>(
          "/performance/metrics/system",
        ),
        apiClient.get<{ suggestions: OptimizationSuggestion[] }>(
          "/performance/optimization-suggestions",
        ),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data.analytics);
      }

      if (metricsRes.success && metricsRes.data) {
        setSystemMetrics(metricsRes.data.metrics);
      }

      if (suggestionsRes.success && suggestionsRes.data) {
        setSuggestions(suggestionsRes.data.suggestions);
      }
    } catch (error) {
      toast.error("Failed to fetch performance data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const clearCache = async (prefix?: string) => {
    try {
      const response = await apiClient.post("/performance/cache/clear", {
        prefix,
      });
      if (response.success) {
        toast.success(
          prefix ? `Cache cleared for ${prefix}` : "All cache cleared",
        );
        await fetchPerformanceData();
      }
    } catch (error) {
      toast.error("Failed to clear cache");
    }
  };

  const exportMetrics = async () => {
    try {
      const response = await fetch("/api/performance/export", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `performance-metrics-${new Date().toISOString().split("T")[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Performance metrics exported");
      }
    } catch (error) {
      toast.error("Failed to export metrics");
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg border animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor system performance and optimization opportunities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchPerformanceData}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {analytics && systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(analytics.requests.averageResponseTime)}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.requests.total} total requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Memory Usage
              </CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemMetrics.memory.percentage.toFixed(1)}%
              </div>
              <Progress
                value={systemMetrics.memory.percentage}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(systemMetrics.memory.used)} used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics.requests.total > 0
                  ? (
                      (analytics.requests.successful /
                        analytics.requests.total) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.requests.failed} failed requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cache Status
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemMetrics.cacheStats.keyCount}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={
                    systemMetrics.cacheStats.connected
                      ? "default"
                      : "destructive"
                  }
                >
                  {systemMetrics.cacheStats.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {systemMetrics.cacheStats.connected
                    ? "Connected"
                    : "Disconnected"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Distribution */}
            {analytics && (
              <Card>
                <CardHeader>
                  <CardTitle>Request Distribution</CardTitle>
                  <CardDescription>Requests by endpoint</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.requests.requestsByEndpoint)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([endpoint, count]) => (
                        <div
                          key={endpoint}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium truncate">
                            {endpoint}
                          </span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* System Health */}
            {systemMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Current system status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Heap Memory</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={systemMetrics.memory.heap.percentage}
                        className="w-20"
                      />
                      <span className="text-sm">
                        {systemMetrics.memory.heap.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Connections</span>
                    <Badge variant="outline">
                      {systemMetrics.activeConnections}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uptime</span>
                    <span className="text-sm">
                      {formatDuration(systemMetrics.uptime * 1000)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Slowest Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Slowest Requests</CardTitle>
                  <CardDescription>Top 10 slowest endpoints</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.requests.slowestRequests
                      .slice(0, 10)
                      .map((request, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded border"
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {request.method} {request.endpoint}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Status: {request.statusCode}
                            </div>
                          </div>
                          <Badge
                            variant={
                              request.duration > 1000
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {formatDuration(request.duration)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Status Code Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Status</CardTitle>
                  <CardDescription>Distribution by status code</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.requests.requestsByStatus).map(
                      ([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">{status}</span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={(count / analytics.requests.total) * 100}
                              className="w-20"
                            />
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {systemMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Memory Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage</CardTitle>
                  <CardDescription>Detailed memory breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Heap Used</span>
                      <span>{formatBytes(systemMetrics.memory.heap.used)}</span>
                    </div>
                    <Progress value={systemMetrics.memory.heap.percentage} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Memory</span>
                      <span>{formatBytes(systemMetrics.memory.total)}</span>
                    </div>
                    <Progress value={systemMetrics.memory.percentage} />
                  </div>
                </CardContent>
              </Card>

              {/* Cache Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Cache Management</CardTitle>
                  <CardDescription>
                    Cache operations and statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div className="font-medium">
                        {systemMetrics.cacheStats.type}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Keys:</span>
                      <div className="font-medium">
                        {systemMetrics.cacheStats.keyCount}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearCache()}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
              <CardDescription>
                Recommendations to improve system performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getPriorityColor(suggestion.priority)}
                          >
                            {suggestion.priority}
                          </Badge>
                          <span className="font-medium">
                            {suggestion.category}
                          </span>
                        </div>
                        {suggestion.priority === "critical" && (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm mb-2">{suggestion.suggestion}</p>
                      <p className="text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        Impact: {suggestion.impact}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      System Optimized
                    </h3>
                    <p className="text-muted-foreground">
                      No optimization suggestions at this time. Your system is
                      performing well!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
