"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Download,
  Upload,
  RotateCcw,
  Save,
  Shield,
  Lock,
  Eye,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

interface SecurityConfig {
  authentication: {
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    maxLoginAttempts: number;
    lockoutDuration: number;
    requireEmailVerification: boolean;
    enableMFA: boolean;
  };
  security: {
    bruteForceProtection: boolean;
    sqlInjectionDetection: boolean;
    xssProtection: boolean;
    csrfProtection: boolean;
    rateLimiting: boolean;
    sessionTimeout: number;
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
    alertCooldown: number;
  };
}

export function SecurityConfig() {
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [importJson, setImportJson] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{
        config: SecurityConfig;
        recommendations: string[];
      }>("/security/config");

      if (response.success && response.data) {
        setConfig(response.data.config);
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      toast.error("Failed to fetch security configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    try {
      setIsSaving(true);
      const response = await apiClient.put("/security/config", { config });

      if (response.success) {
        toast.success("Security configuration updated successfully");
        await fetchConfig(); // Refresh to get updated recommendations
      }
    } catch (error) {
      toast.error("Failed to update security configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const exportConfig = async () => {
    try {
      const response = await fetch("/api/security/config/export", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `security-config-${new Date().toISOString().split("T")[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Configuration exported successfully");
      }
    } catch (error) {
      toast.error("Failed to export configuration");
    }
  };

  const importConfig = async () => {
    if (!importJson.trim()) {
      toast.error("Please enter configuration JSON");
      return;
    }

    try {
      const response = await apiClient.post("/security/config/import", {
        configJson: importJson,
      });

      if (response.success) {
        toast.success("Configuration imported successfully");
        setImportJson("");
        await fetchConfig();
      }
    } catch (error) {
      toast.error("Failed to import configuration");
    }
  };

  const resetConfig = async () => {
    if (!confirm("Are you sure you want to reset to default configuration?")) {
      return;
    }

    try {
      const response = await apiClient.post("/security/config/reset");

      if (response.success) {
        toast.success("Configuration reset to defaults");
        await fetchConfig();
      }
    } catch (error) {
      toast.error("Failed to reset configuration");
    }
  };

  const updateConfig = (
    section: keyof SecurityConfig,
    key: string,
    value: any,
  ) => {
    if (!config) return;

    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [key]: value,
      },
    });
  };

  const updateNestedConfig = (
    section: keyof SecurityConfig,
    nestedKey: string,
    key: string,
    value: any,
  ) => {
    if (!config) return;

    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [nestedKey]: {
          ...(config[section] as any)[nestedKey],
          [key]: value,
        },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Failed to load security configuration
        </p>
        <Button onClick={fetchConfig} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Configuration</h2>
          <p className="text-muted-foreground">
            Manage security settings and policies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={resetConfig}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveConfig} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertTriangle className="h-5 w-5" />
              Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-600 dark:text-orange-400">
                    •
                  </span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Configuration Tabs */}
      <Tabs defaultValue="authentication" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger
            value="authentication"
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Auth
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Authentication Settings */}
        <TabsContent value="authentication">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Settings</CardTitle>
              <CardDescription>
                Configure authentication and session management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="1"
                    max="20"
                    value={config.authentication.maxLoginAttempts}
                    onChange={(e) =>
                      updateConfig(
                        "authentication",
                        "maxLoginAttempts",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">
                    Lockout Duration (minutes)
                  </Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    min="1"
                    max="1440"
                    value={config.authentication.lockoutDuration}
                    onChange={(e) =>
                      updateConfig(
                        "authentication",
                        "lockoutDuration",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireEmailVerification">
                      Require Email Verification
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Users must verify their email before accessing the system
                    </p>
                  </div>
                  <Switch
                    id="requireEmailVerification"
                    checked={config.authentication.requireEmailVerification}
                    onCheckedChange={(checked) =>
                      updateConfig(
                        "authentication",
                        "requireEmailVerification",
                        checked,
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableMFA">
                      Enable Multi-Factor Authentication
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Require additional verification for enhanced security
                    </p>
                  </div>
                  <Switch
                    id="enableMFA"
                    checked={config.authentication.enableMFA}
                    onCheckedChange={(checked) =>
                      updateConfig("authentication", "enableMFA", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security protections and session management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="10080"
                    value={config.security.sessionTimeout}
                    onChange={(e) =>
                      updateConfig(
                        "security",
                        "sessionTimeout",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSessions">Max Concurrent Sessions</Label>
                  <Input
                    id="maxSessions"
                    type="number"
                    min="1"
                    max="50"
                    value={config.security.maxSessions}
                    onChange={(e) =>
                      updateConfig(
                        "security",
                        "maxSessions",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: "bruteForceProtection",
                    label: "Brute Force Protection",
                    description: "Block repeated failed login attempts",
                  },
                  {
                    key: "sqlInjectionDetection",
                    label: "SQL Injection Detection",
                    description: "Detect and block SQL injection attempts",
                  },
                  {
                    key: "xssProtection",
                    label: "XSS Protection",
                    description:
                      "Sanitize input to prevent cross-site scripting",
                  },
                  {
                    key: "rateLimiting",
                    label: "Rate Limiting",
                    description: "Limit request frequency per IP address",
                  },
                ].map((setting) => (
                  <div
                    key={setting.key}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <Label htmlFor={setting.key}>{setting.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                    <Switch
                      id={setting.key}
                      checked={(config.security as any)[setting.key]}
                      onCheckedChange={(checked) =>
                        updateConfig("security", setting.key, checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import/Export */}
        <TabsContent value="notifications">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Configuration</CardTitle>
                <CardDescription>
                  Import security configuration from JSON
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste configuration JSON here..."
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  rows={10}
                />
                <Button onClick={importConfig} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Configuration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure security alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailAlerts">Email Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications for security events
                    </p>
                  </div>
                  <Switch
                    id="emailAlerts"
                    checked={config.notifications.emailAlerts}
                    onCheckedChange={(checked) =>
                      updateConfig("notifications", "emailAlerts", checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alertCooldown">
                    Alert Cooldown (minutes)
                  </Label>
                  <Input
                    id="alertCooldown"
                    type="number"
                    min="1"
                    max="1440"
                    value={config.notifications.alertCooldown}
                    onChange={(e) =>
                      updateConfig(
                        "notifications",
                        "alertCooldown",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
