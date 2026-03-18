"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { usePageStore } from "@/store/page.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import { CommentThread } from "@/components/collaboration/comment-thread";
import { NotificationPanel } from "@/components/collaboration/notification-panel";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bell, Users, Activity } from "lucide-react";
import Link from "next/link";

export default function CollaborationDemoPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { createPage } = usePageStore();
  const { workspaces } = useWorkspaceStore();

  const [demoPageId, setDemoPageId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const createDemoPage = async () => {
    if (!isAuthenticated || workspaces.length === 0) return;

    setIsCreating(true);
    try {
      const demoPage = await createPage({
        title: "Collaboration Demo",
        icon: "🤝",
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
          <h1 className="text-3xl font-bold mb-4">Collaboration Demo</h1>
          <p className="text-muted-foreground mb-6">
            Experience real-time collaboration features including comments,
            mentions, notifications, and activity feeds.
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
          <h1 className="text-3xl font-bold mb-4">Collaboration Demo</h1>
          <p className="text-muted-foreground mb-6">
            Welcome, {user?.firstName || user?.username}! Create a demo page to
            experience our collaboration features.
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
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg text-left">
                <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  What you'll experience:
                </h3>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                  <li>• Real-time commenting system</li>
                  <li>• Threaded conversations with replies</li>
                  <li>• Notification system</li>
                  <li>• Activity feeds and mentions</li>
                  <li>• Comment resolution workflow</li>
                </ul>
              </div>

              <Button
                onClick={createDemoPage}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? "Creating Demo Page..." : "Create Demo Page"}
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
            <h1 className="font-semibold">Collaboration Demo</h1>
          </div>

          <div className="flex items-center gap-2">
            <NotificationPanel />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Comments
            </Button>
            <div className="text-sm text-muted-foreground">Demo Mode</div>
          </div>
        </div>
      </header>

      {/* Demo Instructions */}
      <div className="bg-purple-50 dark:bg-purple-950 border-b border-purple-200 dark:border-purple-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
            <span className="font-medium">💡 Demo Tips:</span>
            <span>
              Click "Comments" to open the comment panel, try adding comments,
              and check the notification bell for updates.
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <div className="text-6xl mb-4">🤝</div>
            <h1 className="text-4xl font-bold mb-4">Collaboration Demo</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              This demo showcases our real-time collaboration features. Try
              adding comments, mentioning users, and exploring the notification
              system.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">Comments & Replies</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Add comments to pages and blocks. Create threaded conversations
                with replies and resolve discussions when complete.
              </p>
              <Button
                onClick={() => setShowComments(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Open Comments Panel
              </Button>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold">Notifications</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Get notified when someone mentions you, comments on your
                content, or invites you to collaborate.
              </p>
              <div className="flex items-center justify-center">
                <NotificationPanel />
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold">Team Collaboration</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Invite team members to workspaces, assign roles, and collaborate
                on documents in real-time.
              </p>
              <Button variant="outline" size="sm" className="w-full" disabled>
                Coming Soon
              </Button>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold">Activity Feeds</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Track all changes and activities in your workspace. See who
                edited what and when.
              </p>
              <Button variant="outline" size="sm" className="w-full" disabled>
                Coming Soon
              </Button>
            </div>
          </div>

          {/* Sample Content */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Sample Content</h2>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                This is a sample paragraph where you can practice adding
                comments. Click the "Comments" button in the header to open the
                comment panel and try adding your first comment.
              </p>

              <h3>Project Planning</h3>
              <p>
                Here's another section where team members might collaborate. In
                a real scenario, you could mention team members using @username
                to notify them about specific parts of the document.
              </p>

              <ul>
                <li>Define project scope and requirements</li>
                <li>Create timeline and milestones</li>
                <li>Assign tasks to team members</li>
                <li>Set up regular check-ins and reviews</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Comment Thread */}
      <CommentThread
        pageId={demoPageId}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
}
