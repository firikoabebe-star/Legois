"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { usePageStore } from "@/store/page.store";
import { BlockEditor } from "@/components/editor/block-editor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditorPage() {
  const params = useParams();
  const pageId = params.pageId as string;

  const { isAuthenticated } = useAuthStore();
  const { currentPage, fetchPage, isLoading, error } = usePageStore();

  useEffect(() => {
    if (pageId && isAuthenticated) {
      fetchPage(pageId);
    }
  }, [pageId, isAuthenticated, fetchPage]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to access the page editor.
          </p>
          <Button asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
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
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              {currentPage.icon && (
                <span className="text-lg">{currentPage.icon}</span>
              )}
              <h1 className="font-semibold truncate max-w-[200px]">
                {currentPage.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Last edited {new Date(currentPage.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="container mx-auto">
        <BlockEditor pageId={pageId} />
      </main>
    </div>
  );
}
