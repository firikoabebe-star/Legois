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
  UserCheck,
  UserX,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export function UsersManagement() {
  const {
    users,
    usersPagination,
    isLoadingUsers,
    fetchUsers,
    suspendUser,
    reactivateUser,
  } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      fetchUsers(1, query || undefined);
    }, 500);

    setSearchTimeout(timeout);
  };

  const handleSuspendUser = async (userId: string, username: string) => {
    if (confirm(`Are you sure you want to suspend user "${username}"?`)) {
      try {
        await suspendUser(userId);
        toast.success("User suspended successfully");
      } catch (error) {
        toast.error("Failed to suspend user");
      }
    }
  };

  const handleReactivateUser = async (userId: string, username: string) => {
    if (confirm(`Are you sure you want to reactivate user "${username}"?`)) {
      try {
        await reactivateUser(userId);
        toast.success("User reactivated successfully");
      } catch (error) {
        toast.error("Failed to reactivate user");
      }
    }
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page, searchQuery || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Users Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-medium">All Users ({usersPagination.total})</h3>
        </div>

        {isLoadingUsers ? (
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
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
            {users.map((user) => (
              <div
                key={user.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      (
                        user.firstName?.charAt(0) || user.username.charAt(0)
                      ).toUpperCase()
                    )}
                  </div>

                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.username}
                      {user.emailVerified && (
                        <UserCheck className="h-4 w-4 text-green-500" />
                      )}
                      {user.deletedAt && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs rounded-full">
                          Suspended
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {user._count.createdPages}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {user._count.comments}
                    </span>
                    <span>
                      {user.workspaceMembers.length} workspace
                      {user.workspaceMembers.length !== 1 ? "s" : ""}
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
                      {user.deletedAt ? (
                        <DropdownMenuItem
                          onClick={() =>
                            handleReactivateUser(user.id, user.username)
                          }
                          className="text-green-600 focus:text-green-600"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Reactivate user
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            handleSuspendUser(user.id, user.username)
                          }
                          className="text-red-600 focus:text-red-600"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Suspend user
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {usersPagination.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(usersPagination.page - 1) * 20 + 1} to{" "}
              {Math.min(usersPagination.page * 20, usersPagination.total)} of{" "}
              {usersPagination.total} users
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(usersPagination.page - 1)}
                disabled={usersPagination.page <= 1}
              >
                Previous
              </Button>

              <span className="text-sm">
                Page {usersPagination.page} of {usersPagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(usersPagination.page + 1)}
                disabled={usersPagination.page >= usersPagination.totalPages}
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
