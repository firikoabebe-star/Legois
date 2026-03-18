"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/store/admin.store";
import {
  Activity,
  User,
  Building,
  FileText,
  MessageSquare,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";

export function ActivityLog() {
  const { activities, isLoadingActivities, fetchActivities } = useAdminStore();

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "created":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "updated":
      case "edited":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "deleted":
      case "suspended":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "commented":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity.toLowerCase()) {
      case "user":
        return <User className="h-3 w-3" />;
      case "workspace":
        return <Building className="h-3 w-3" />;
      case "page":
        return <FileText className="h-3 w-3" />;
      case "comment":
        return <MessageSquare className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const formatActivityMessage = (activity: any) => {
    const userName =
      activity.user.firstName && activity.user.lastName
        ? `${activity.user.firstName} ${activity.user.lastName}`
        : activity.user.username;

    let message = `${userName} ${activity.action} ${activity.entity}`;

    if (activity.workspace) {
      message += ` in ${activity.workspace.name}`;
    }

    if (activity.page) {
      message += ` "${activity.page.title}"`;
    }

    if (activity.details?.workspaceName) {
      message += ` "${activity.details.workspaceName}"`;
    }

    return message;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Recent Activity</h2>
        <p className="text-muted-foreground">
          Monitor system-wide user activity and changes
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Log
          </h3>
        </div>

        {isLoadingActivities ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : activities.length > 0 ? (
          <div className="divide-y max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {activity.user.avatar ? (
                    <img
                      src={activity.user.avatar}
                      alt={activity.user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <span className="text-xs font-medium">
                      {(
                        activity.user.firstName?.charAt(0) ||
                        activity.user.username.charAt(0)
                      ).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActionIcon(activity.action)}
                    <span className="text-sm font-medium">
                      {formatActivityMessage(activity)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {getEntityIcon(activity.entity)}
                    <span className="capitalize">{activity.entity}</span>
                    <span>•</span>
                    <span>{new Date(activity.createdAt).toLocaleString()}</span>
                  </div>

                  {activity.details &&
                    Object.keys(activity.details).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(activity.details, null, 2)}
                        </pre>
                      </div>
                    )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No activity yet</h3>
            <p className="text-sm text-muted-foreground">
              User activities will appear here as they happen
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
