"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  AlertTriangle,
  Activity,
  Users,
  Lock,
  Eye,
  Ban,
  MoreHorizontal,
  Download,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface SecurityEvent {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  ip: string;
  userAgent: string;
  userId?: string;
  details: any;
}

interface SecurityAnalytics {
  totalAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  uniqueIPs: number;
  activeSessions: number;
  suspiciousActivity: number;
  securityEvents: {
    total: number;
    byType: { [key: string]: number };
    bySeverity: { [key: string]: number };
  };
}

export function SecurityDashboard() {
  const [analytics, setAnalytics] = useState<SecurityAnalytics | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [searchIP, setSearchIP] = useState("");

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);

      const [analyticsRes, eventsRes] = await Promise.all([
        apiClient.get<{ analytics: SecurityAnalytics }>("/security/analytics"),
        apiClient.get<{ events: SecurityEvent[] }>("/security/events?limit=50"),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data.analytics);
      }

      if (eventsRes.success && eventsRes.data) {
        setEvents(eventsRes.data.events);
      }
    } catch (error) {
      toast.error("Failed to fetch security data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockIP = async (ip: string) => {
    if (confirm(`Are you sure you want to block IP address ${ip}?`)) {
      try {
        await apiClient.post("/security/block-ip", {
          ip,
          reason: "Suspicious activity detected",
          duration: 3600, // 1 hour
        });
        toast.success(`IP ${ip} blocked successfully`);
      } catch (error) {
        toast.error("Failed to block IP address");
      }
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (confirm(`Are you sure you want to suspend user ${userId}?`)) {
      try {
        await apiClient.post("/security/suspend-user", {
          userId,
          reason: "Security violation detected",
        });
        toast.success(`User ${userId} suspended successfully`);
      } catch (error) {
        toast.error("Failed to suspend user");
      }
    }
  };

  const downloadSecurityReport = async () => {
    try {
      const response = await apiClient.get("/security/audit/report");
      if (response.success) {
        // Create and download JSON file
        const dataStr = JSON.stringify(response.data.report, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `security-audit-${new Date().toISOString().split("T")[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Security report downloaded");
      }
    } catch (error) {
      toast.error("Failed to download security report");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "high":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
      case "medium":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
      case "low":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "suspicious_login":
        return <Users className="h-4 w-4" />;
      case "brute_force_attempt":
        return <Lock className="h-4 w-4" />;
      case "invalid_token":
        return <Shield className="h-4 w-4" />;
      case "privilege_escalation":
        return <AlertTriangle className="h-4 w-4" />;
      case "sql_injection_attempt":
        return <Ban className="h-4 w-4" />;
      case "xss_attempt":
        return <Ban className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
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
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor security events and system threats
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchSecurityData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={downloadSecurityReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Login Attempts
                </p>
                <p className="text-2xl font-bold">
                  {analytics.totalAttempts.toLocaleString()}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Failed Logins
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {analytics.failedLogins.toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Sessions
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.activeSessions.toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Unique IPs
                </p>
                <p className="text-2xl font-bold">
                  {analytics.uniqueIPs.toLocaleString()}
                </p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Security Events
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {analytics.securityEvents.total.toLocaleString()}
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Suspicious Activity
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {analytics.suspiciousActivity.toLocaleString()}
                </p>
              </div>
              <Ban className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Security Events */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Recent Security Events</h3>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Search by IP..."
                value={searchIP}
                onChange={(e) => setSearchIP(e.target.value)}
                className="w-48"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {selectedEventType === "all"
                      ? "All Events"
                      : selectedEventType}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedEventType("all")}>
                    All Events
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedEventType("suspicious_login")}
                  >
                    Suspicious Logins
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedEventType("brute_force_attempt")}
                  >
                    Brute Force
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedEventType("invalid_token")}
                  >
                    Invalid Tokens
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="divide-y max-h-96 overflow-y-auto">
          {events
            .filter(
              (event) =>
                (selectedEventType === "all" ||
                  event.type === selectedEventType) &&
                (searchIP === "" || event.ip.includes(searchIP)),
            )
            .map((event) => (
              <div
                key={event.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getEventTypeIcon(event.type)}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}
                    >
                      {event.severity}
                    </span>
                  </div>

                  <div>
                    <div className="font-medium">
                      {event.type
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      IP: {event.ip} •{" "}
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleBlockIP(event.ip)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Block IP
                    </DropdownMenuItem>
                    {event.userId && (
                      <DropdownMenuItem
                        onClick={() => handleSuspendUser(event.userId!)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Suspend User
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
