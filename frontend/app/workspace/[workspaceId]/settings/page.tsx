"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useAuthStore } from "@/store/auth.store";
import { WorkspaceSettings } from "@/components/workspace/workspace-settings";
import { MemberManagement } from "@/components/workspace/member-management";
import { Button } from "@/components/ui/button";
import { Settings, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Tab = "general" | "members";

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { currentWorkspace, fetchWorkspace, isLoading } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("general");

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace(workspaceId);
    }
  }, [workspaceId, fetchWorkspace]);

  const currentUserRole = currentWorkspace?.members.find(
    (m) => m.userId === user?.id,
  )?.role;
  const canManageSettings =
    currentUserRole?.canManageSettings || currentUserRole?.name === "owner";
  const canManageMembers =
    currentUserRole?.canManageMembers || currentUserRole?.name === "owner";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Workspace not found</h1>
          <p className="text-muted-foreground mb-4">
            The workspace you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <Link href="/">
            <Button>Go home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!canManageSettings && !canManageMembers) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access workspace settings.
          </p>
          <Link href={`/workspace/${workspaceId}`}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to workspace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/workspace/${workspaceId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to workspace
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {currentWorkspace.icon || currentWorkspace.name.charAt(0)}
            </div>
            <h1 className="text-2xl font-bold">
              {currentWorkspace.name} Settings
            </h1>
          </div>

          <p className="text-muted-foreground">
            Manage your workspace settings and members
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b mb-8">
          <nav className="flex space-x-8">
            {canManageSettings && (
              <button
                onClick={() => setActiveTab("general")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "general"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                General
              </button>
            )}

            {canManageMembers && (
              <button
                onClick={() => setActiveTab("members")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "members"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Members ({currentWorkspace._count.members})
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {activeTab === "general" && canManageSettings && (
            <div className="p-6">
              <WorkspaceSettings workspace={currentWorkspace} />
            </div>
          )}

          {activeTab === "members" && canManageMembers && (
            <div className="p-6">
              <MemberManagement workspaceId={workspaceId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
