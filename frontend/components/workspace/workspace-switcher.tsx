"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, Settings, Users, Shield } from "lucide-react";
import Link from "next/link";

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, setCurrentWorkspace } =
    useWorkspaceStore();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleWorkspaceSelect = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
    setIsOpen(false);
  };

  const currentUserRole = currentWorkspace?.members.find(
    (m) => m.userId === user?.id,
  )?.role;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 py-2 h-auto"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {currentWorkspace?.icon || currentWorkspace?.name.charAt(0)}
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">
                {currentWorkspace?.name || "Select Workspace"}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentUserRole?.name || "No role"}
              </div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="start">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Workspaces
          </p>
        </div>

        {workspaces.map((workspace) => {
          const userRole = workspace.members.find(
            (m) => m.userId === user?.id,
          )?.role;
          const isSelected = currentWorkspace?.id === workspace.id;

          return (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleWorkspaceSelect(workspace.id)}
              className={`flex items-center gap-2 px-2 py-2 ${isSelected ? "bg-accent" : ""}`}
            >
              <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                {workspace.icon || workspace.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{workspace.name}</div>
                <div className="text-xs text-muted-foreground">
                  {userRole?.name} • {workspace._count.members} members
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <DropdownMenuItem className="flex items-center gap-2 px-2 py-2" asChild>
          <Link href="/workspace/new">
            <Plus className="h-4 w-4" />
            <span>Create workspace</span>
          </Link>
        </DropdownMenuItem>

        {currentUserRole?.canManageSettings && (
          <DropdownMenuItem className="flex items-center gap-2 px-2 py-2">
            <Settings className="h-4 w-4" />
            <span>Workspace settings</span>
          </DropdownMenuItem>
        )}

        {currentUserRole?.canManageMembers && (
          <DropdownMenuItem
            className="flex items-center gap-2 px-2 py-2"
            asChild
          >
            <Link href={`/workspace/${currentWorkspace.id}/settings`}>
              <Users className="h-4 w-4" />
              <span>Manage members</span>
            </Link>
          </DropdownMenuItem>
        )}

        {(user?.email === "demo@example.com" ||
          user?.email.endsWith("@admin.com")) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 px-2 py-2"
              asChild
            >
              <Link href="/admin">
                <Shield className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
