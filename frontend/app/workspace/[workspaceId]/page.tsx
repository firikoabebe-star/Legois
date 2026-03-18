"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspace.store";
import { usePageStore } from "@/store/page.store";
import { useAuthStore } from "@/store/auth.store";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { Button } from "@/components/ui/button";
import { Plus, Settings, FileText, Database, Users } from "lucide-react";
import Link from "next/link";

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const {
    currentWorkspace,
    fetchWorkspace,
    isLoading: workspaceLoading,
  } = useWorkspaceStore();
  const { pages, fetchPages, isLoading: pagesLoading } = usePageStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace(workspaceId);
      fetchPages(workspaceId);
    }
  }, [workspaceId, fetchWorkspace, fetchPages]);

  const currentUserRole = currentWorkspace?.members.find(
    (m) => m.userId === user?.id,
  )?.role;
  const canCreatePages = currentUserRole?.canCreatePages;
  const canManageSettings =
    currentUserRole?.canManageSettings || currentUserRole?.name === "owner";

  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-800 border-r h-screen">
            <div className="p-4">
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
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

  const recentPages = pages.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r h-screen overflow-y-auto">
          <div className="p-4">
            <WorkspaceSwitcher />

            <div className="mt-6 space-y-2">
              {canCreatePages && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/workspace/${workspaceId}/new-page`}>
                    <Plus className="h-4 w-4 mr-2" />
                    New page
                  </Link>
                </Button>
              )}

              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href={`/workspace/${workspaceId}/pages`}>
                  <FileText className="h-4 w-4 mr-2" />
                  All pages
                </Link>
              </Button>

              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href={`/workspace/${workspaceId}/databases`}>
                  <Database className="h-4 w-4 mr-2" />
                  Databases
                </Link>
              </Button>

              {canManageSettings && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/workspace/${workspaceId}/settings`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
              )}
            </div>

            {/* Recent Pages */}
            {recentPages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Recent pages
                </h3>
                <div className="space-y-1">
                  {recentPages.map((page) => (
                    <Link
                      key={page.id}
                      href={`/editor/${page.id}`}
                      className="block px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                    >
                      <span className="mr-2">{page.icon || "📄"}</span>
                      {page.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded bg-blue-500 flex items-center justify-center text-white text-lg font-medium">
                  {currentWorkspace.icon || currentWorkspace.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    {currentWorkspace.name}
                  </h1>
                  {currentWorkspace.description && (
                    <p className="text-muted-foreground">
                      {currentWorkspace.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {currentWorkspace._count.members} members
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {currentWorkspace._count.pages} pages
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {canCreatePages && (
                <Link
                  href={`/workspace/${workspaceId}/new-page`}
                  className="p-6 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-8 w-8 text-blue-500 mb-3" />
                  <h3 className="font-medium mb-1">Create a page</h3>
                  <p className="text-sm text-muted-foreground">
                    Start writing and organizing your thoughts
                  </p>
                </Link>
              )}

              <Link
                href={`/workspace/${workspaceId}/databases`}
                className="p-6 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Database className="h-8 w-8 text-green-500 mb-3" />
                <h3 className="font-medium mb-1">Browse databases</h3>
                <p className="text-sm text-muted-foreground">
                  View and manage your structured data
                </p>
              </Link>

              <Link
                href={`/workspace/${workspaceId}/settings`}
                className="p-6 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Users className="h-8 w-8 text-purple-500 mb-3" />
                <h3 className="font-medium mb-1">Team collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Invite members and manage permissions
                </p>
              </Link>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-medium mb-4">Recent pages</h2>

              {pagesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : pages.length > 0 ? (
                <div className="space-y-3">
                  {pages.slice(0, 10).map((page) => (
                    <Link
                      key={page.id}
                      href={`/editor/${page.id}`}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">
                        {page.icon || "📄"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{page.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Updated{" "}
                          {new Date(page.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium mb-1">No pages yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first page to get started
                  </p>
                  {canCreatePages && (
                    <Button asChild>
                      <Link href={`/workspace/${workspaceId}/new-page`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create page
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
