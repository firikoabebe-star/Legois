"use client";

import { useState, useEffect } from "react";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserPlus,
  MoreHorizontal,
  Crown,
  Shield,
  User,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceMember, Role } from "@/types";

interface MemberManagementProps {
  workspaceId: string;
}

export function MemberManagement({ workspaceId }: MemberManagementProps) {
  const {
    currentWorkspace,
    roles,
    inviteMember,
    removeMember,
    fetchRoles,
    isLoading,
  } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (roles.length > 0) {
      const memberRole = roles.find((r) => r.name === "member");
      if (memberRole) {
        setSelectedRole(memberRole.id);
      }
    }
  }, [roles]);

  const currentUserRole = currentWorkspace?.members.find(
    (m) => m.userId === user?.id,
  )?.role;
  const canManageMembers =
    currentUserRole?.canManageMembers || currentUserRole?.name === "owner";

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !selectedRole) {
      toast.error("Please enter email and select a role");
      return;
    }

    setIsInviting(true);
    try {
      await inviteMember(workspaceId, inviteEmail, selectedRole);
      toast.success("Member invited successfully!");
      setInviteEmail("");
    } catch (error) {
      toast.error("Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (
      confirm(
        `Are you sure you want to remove ${memberName} from this workspace?`,
      )
    ) {
      try {
        await removeMember(workspaceId, memberId);
        toast.success("Member removed successfully!");
      } catch (error) {
        toast.error("Failed to remove member");
      }
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "member":
        return <User className="h-4 w-4 text-green-500" />;
      case "guest":
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case "owner":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "member":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "guest":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  if (!currentWorkspace) return null;

  return (
    <div className="space-y-6">
      {/* Invite Member Section */}
      {canManageMembers && (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite member
          </h3>

          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">
                  {selectedRole
                    ? roles.find((r) => r.id === selectedRole)?.name
                    : "Select role"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {roles.map((role) => (
                  <DropdownMenuItem
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className="flex items-center gap-2"
                  >
                    {getRoleIcon(role.name)}
                    <div>
                      <div className="font-medium capitalize">{role.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {role.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={handleInviteMember}
              disabled={isInviting || !inviteEmail.trim() || !selectedRole}
            >
              {isInviting ? "Inviting..." : "Invite"}
            </Button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-medium">
            Members ({currentWorkspace._count.members})
          </h3>
        </div>

        <div className="divide-y">
          {currentWorkspace.members.map((member) => {
            const isCurrentUser = member.userId === user?.id;
            const canRemove =
              canManageMembers &&
              !isCurrentUser &&
              member.role.name !== "owner";

            return (
              <div
                key={member.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {member.user.avatar ? (
                      <img
                        src={member.user.avatar}
                        alt={member.user.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      (
                        member.user.firstName?.charAt(0) ||
                        member.user.username.charAt(0)
                      ).toUpperCase()
                    )}
                  </div>

                  <div>
                    <div className="font-medium">
                      {member.user.firstName && member.user.lastName
                        ? `${member.user.firstName} ${member.user.lastName}`
                        : member.user.username}
                      {isCurrentUser && (
                        <span className="text-sm text-muted-foreground ml-2">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role.name)}`}
                  >
                    {member.role.name}
                  </span>

                  {canRemove && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleRemoveMember(member.id, member.user.username)
                          }
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
