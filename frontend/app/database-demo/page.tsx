"use client";

import { useState } from "react";
import { DatabaseViewer } from "@/components/database/database-viewer";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { useDatabaseStore } from "@/store/database.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import Link from "next/link";

export default function DatabaseDemoPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { createDatabase } = useDatabaseStore();
  const { workspaces } = useWorkspaceStore();
  const [demoDatabaseId, setDemoDatabaseId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createDemoDatabase = async () => {
    if (!isAuthenticated || workspaces.length === 0) return;

    setIsCreating(true);
    try {
      const demoDatabase = await createDatabase({
        name: "Project Tracker",
        description: "Track your team projects and tasks",
        icon: "📋",
        workspaceId: workspaces[0].id,
      });
      setDemoDatabaseId(demoDatabase.id);
    } catch (error) {
      console.error("Failed to create demo database:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Database Demo</h1>
          <p className="text-muted-foreground mb-6">
            Experience our powerful Notion-style database with table views,
            custom properties, and real-time editing.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/login">Sign In to Try Demo</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!demoDatabaseId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Database Demo</h1>
          <p className="text-muted-foreground mb-6">
            Welcome, {user?.firstName || user?.username}! Create a demo database
            to experience our powerful data management features.
          </p>

          {workspaces.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You need a workspace to create databases.
              </p>
              <Button asChild>
                <Link href="/">Create Workspace</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-left">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  What you'll experience:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Table view with sortable columns</li>
                  <li>• Custom property types (text, number, select, date)</li>
                  <li>• Real-time cell editing</li>
                  <li>• Add/remove rows and properties</li>
                  <li>• Multiple view types (coming soon)</li>
                </ul>
              </div>

              <Button
                onClick={createDemoDatabase}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating
                  ? "Creating Demo Database..."
                  : "Create Demo Database"}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">← Back to Home</Link>
            </Button>
            <h1 className="font-semibold">Database Demo</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">Demo Mode</div>
          </div>
        </div>
      </header>

      {/* Demo Instructions */}
      <div className="bg-green-50 dark:bg-green-950 border-b border-green-200 dark:border-green-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
            <span className="font-medium">💡 Demo Tips:</span>
            <span>
              Click cells to edit, use the "+" button to add properties, and try
              different view types from the dropdown.
            </span>
          </div>
        </div>
      </div>

      {/* Database Viewer */}
      <main className="h-[calc(100vh-7rem)]">
        <DatabaseViewer databaseId={demoDatabaseId} />
      </main>
    </div>
  );
}
