"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useDatabaseStore } from "@/store/database.store";
import { DatabaseViewer } from "@/components/database/database-viewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DatabasePage() {
  const params = useParams();
  const databaseId = params.databaseId as string;

  const { isAuthenticated } = useAuthStore();
  const { currentDatabase, fetchDatabase, isLoading, error } =
    useDatabaseStore();

  useEffect(() => {
    if (databaseId && isAuthenticated) {
      fetchDatabase(databaseId);
    }
  }, [databaseId, isAuthenticated, fetchDatabase]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to access the database.
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
          <p className="text-muted-foreground">Loading database...</p>
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

  if (!currentDatabase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Database Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The database you're looking for doesn't exist or you don't have
            access to it.
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
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">Database View</div>
          </div>
        </div>
      </header>

      {/* Database Viewer */}
      <main className="h-[calc(100vh-3.5rem)]">
        <DatabaseViewer databaseId={databaseId} />
      </main>
    </div>
  );
}
