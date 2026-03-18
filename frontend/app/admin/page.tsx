"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { AdminStats } from "@/components/admin/admin-stats";
import { UsersManagement } from "@/components/admin/users-management";
import { WorkspacesManagement } from "@/components/admin/workspaces-management";
import { ActivityLog } from "@/components/admin/activity-log";
import { SecurityDashboard } from "@/components/admin/security-dashboard";
import { SecurityConfig } from "@/components/admin/security-config";
import { PerformanceDashboard } from "@/components/admin/performance-dashboard";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Building,
  Activity,
  Shield,
  ArrowLeft,
  Settings,
  Zap,
} from "lucide-react";
import Link from "next/link";

type Tab =
  | "overview"
  | "users"
  | "workspaces"
  | "activity"
  | "security"
  | "config"
  | "performance";
  | "config";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initializeAdmin = async () => {
      await checkAuth();

      // Check if user is admin (demo user or admin email)
      if (user) {
        const adminCheck =
          user.email === "demo@example.com" ||
          user.email.endsWith("@admin.com");
        setIsAdmin(adminCheck);

        if (!adminCheck) {
          router.push("/");
          return;
        }
      }

      setIsLoading(false);
    };

    initializeAdmin();
  }, [user, checkAuth, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access the admin dashboard.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "overview" as Tab,
      label: "Overview",
      icon: BarChart3,
    },
    {
      id: "users" as Tab,
      label: "Users",
      icon: Users,
    },
    {
      id: "workspaces" as Tab,
      label: "Workspaces",
      icon: Building,
    },
    {
      id: "activity" as Tab,
      label: "Activity",
      icon: Activity,
    },
    {
      id: "security" as Tab,
      label: "Security",
      icon: Shield,
    },
    {
      id: "config" as Tab,
      label: "Config",
      icon: Settings,
    },
    {
      id: "performance" as Tab,
      label: "Performance",
      icon: Zap,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to home
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage users, workspaces, and monitor system activity
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              Welcome, {user.firstName || user.username}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && (
            <div className="space-y-8">
              <AdminStats />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-2">
                  <ActivityLog />
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && <UsersManagement />}
          {activeTab === "workspaces" && <WorkspacesManagement />}
          {activeTab === "activity" && <ActivityLog />}
          {activeTab === "security" && <SecurityDashboard />}
          {activeTab === "config" && <SecurityConfig />}
          {activeTab === "performance" && <PerformanceDashboard />}
        </div>
      </div>
    </div>
  );
}
