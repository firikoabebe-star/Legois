"use client";

import { useState } from "react";
import { BlockEditor } from "@/components/editor/block-editor";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { usePageStore } from "@/store/page.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import Link from "next/link";

export default function DemoPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { createPage } = usePageStore();
  const { workspaces } = useWorkspaceStore();
  const [demoPageId, setDemoPageId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createDemoPage = async () => {
    if (!isAuthenticated || workspaces.length === 0) return;

    setIsCreating(true);
    try {
      const demoPage = await createPage({
        title: "Demo Page",
        icon: "📝",
        workspaceId: workspaces[0].id,
      });
      setDemoPageId(demoPage.id);
    } catch (error) {
      console.error("Failed to create demo page:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Block Editor Demo</h1>
          <p className="text-muted-foreground mb-6">
            Experience our Notion-style block editor with drag-and-drop
            functionality, multiple block types, and real-time editing.
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

  if (!demoPageId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Block Editor Demo</h1>
          <p className="text-muted-foreground mb-6">
            Welcome, {user?.firstName || user?.username}! Create a demo page to
            experience our powerful block editor.
          </p>

          {workspaces.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You need a workspace to create pages.
              </p>
              <Button asChild>
                <Link href="/">Create Workspace</Link>
              </Button>
            </div>
          ) : (
            <Button
              onClick={createDemoPage}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating Demo Page..." : "Create Demo Page"}
            </Button>
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
            <h1 className="font-semibold">Block Editor Demo</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">Demo Mode</div>
          </div>
        </div>
      </header>

      {/* Demo Instructions */}
      <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">💡 Demo Tips:</span>
            <span>
              Try typing "/" for block commands, drag blocks to reorder, and use
              the "+" button to add new blocks.
            </span>
          </div>
        </div>
      </div>

      {/* Editor */}
      <main className="container mx-auto">
        <BlockEditor pageId={demoPageId} />
      </main>
    </div>
  );
}
