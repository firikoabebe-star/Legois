"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/store/admin.store";
import {
  Users,
  Building,
  FileText,
  Blocks,
  Activity,
  TrendingUp,
  Calendar,
} from "lucide-react";

export function AdminStats() {
  const { stats, isLoading, fetchStats } = useAdminStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg border animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Total Workspaces",
      value: stats.totalWorkspaces.toLocaleString(),
      icon: Building,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Total Pages",
      value: stats.totalPages.toLocaleString(),
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Total Blocks",
      value: stats.totalBlocks.toLocaleString(),
      icon: Blocks,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: Activity,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      subtitle: "Last 30 days",
    },
    {
      title: "New Users",
      value: stats.newUsersThisMonth.toLocaleString(),
      icon: TrendingUp,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      subtitle: "This month",
    },
    {
      title: "New Workspaces",
      value: stats.newWorkspacesThisMonth.toLocaleString(),
      icon: Calendar,
      color: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-900/20",
      subtitle: "This month",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subtitle}
                  </p>
                )}
              </div>
              <div
                className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
              >
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
