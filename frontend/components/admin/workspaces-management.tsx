"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/store/admin.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Trash2,
  Users,
  FileText,
  Calendar,
  Globe,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export function WorkspacesManagement() {
  const {
    workspaces,
    workspacesPagination,
    isLoadingWorkspaces,
    fetchWorkspaces,
    deleteWorkspace,
  } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      fetchWorkspaces(1, query || undefined);
    }, 500);

    setSearchTimeout(timeout);
  };

  const handleDeleteWorkspace = async (
    workspaceId: string,
    workspaceName: string,
  ) => {
    if (
      confirm(
        `Are you sure you want to delete workspace "${workspaceName}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteWorkspace(workspaceId);
        toast.success("Workspace deleted successfully");
      } catch (error) {
        toast.error("Failed to delete workspace");
      }
    }
  };

  const handlePageChange = (page: number) => {
    fetchWorkspaces(page, searchQuery || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workspaces Management</h2>
          <p className="text-muted-foreground">
            Manage workspaces and their settings
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Workspaces Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-medium">
            All Workspaces ({workspacesPagination.total})
          </h3>
        </div>

        {isLoadingWorkspaces ? (
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-blue-500 flex items-center justify-center text-white text-lg font-medium">
                    {workspace.icon || workspace.name.charAt(0)}
                  </div>

                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {workspace.name}
                      {workspace.isPublic ? (
                        <Globe className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {workspace.description || "No description"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
                      <span>Created by {workspace.creator.username}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(workspace.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {workspace._count.members}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {workspace._count.pages}
                    </span>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleDeleteWorkspace(workspace.id, workspace.name)
                        }
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {workspacesPagination.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(workspacesPagination.page - 1) * 20 + 1} to{" "}
              {Math.min(
                workspacesPagination.page * 20,
                workspacesPagination.total,
              )}{" "}
              of {workspacesPagination.total} workspaces
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(workspacesPagination.page - 1)}
                disabled={workspacesPagination.page <= 1}
              >
                Previous
              </Button>

              <span className="text-sm">
                Page {workspacesPagination.page} of{" "}
                {workspacesPagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(workspacesPagination.page + 1)}
                disabled={
                  workspacesPagination.page >= workspacesPagination.totalPages
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
