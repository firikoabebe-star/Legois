"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Workspace } from "@/types";

const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  icon: z.string().optional(),
  isPublic: z.boolean().optional(),
  allowGuests: z.boolean().optional(),
});

type UpdateWorkspaceForm = z.infer<typeof updateWorkspaceSchema>;

interface WorkspaceSettingsProps {
  workspace: Workspace;
}

export function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
  const { updateWorkspace, deleteWorkspace, isLoading } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [selectedEmoji, setSelectedEmoji] = useState(workspace.icon || "🏢");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentUserRole = workspace.members.find(
    (m) => m.userId === user?.id,
  )?.role;
  const canManageSettings =
    currentUserRole?.canManageSettings || currentUserRole?.name === "owner";
  const isOwner = currentUserRole?.name === "owner";

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
  } = useForm<UpdateWorkspaceForm>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description || "",
      icon: workspace.icon || "",
      isPublic: workspace.isPublic,
      allowGuests: workspace.allowGuests,
    },
  });

  const emojis = [
    "🏢",
    "🚀",
    "💼",
    "🎯",
    "⚡",
    "🌟",
    "🔥",
    "💡",
    "🎨",
    "📊",
    "🛠️",
    "🌈",
  ];

  const onSubmit = async (data: UpdateWorkspaceForm) => {
    try {
      await updateWorkspace(workspace.id, {
        ...data,
        icon: selectedEmoji,
      });
      toast.success("Workspace updated successfully!");
    } catch (error) {
      toast.error("Failed to update workspace");
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      await deleteWorkspace(workspace.id);
      toast.success("Workspace deleted successfully!");
      // Navigation will be handled by the store
    } catch (error) {
      toast.error("Failed to delete workspace");
    }
  };

  if (!canManageSettings) {
    return (
      <div className="text-center py-8">
        <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Access Denied</h3>
        <p className="text-muted-foreground">
          You don't have permission to manage workspace settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">General Settings</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setSelectedEmoji(emoji);
                    setValue("icon", emoji, { shouldDirty: true });
                  }}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedEmoji === emoji
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Workspace name *
            </label>
            <Input
              id="name"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
            >
              Description
            </label>
            <Textarea
              id="description"
              {...register("description")}
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Public workspace</label>
                <p className="text-xs text-muted-foreground">
                  Allow anyone to discover and join this workspace
                </p>
              </div>
              <input
                type="checkbox"
                {...register("isPublic")}
                className="rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Allow guests</label>
                <p className="text-xs text-muted-foreground">
                  Allow members to invite guests with limited access
                </p>
              </div>
              <input
                type="checkbox"
                {...register("allowGuests")}
                className="rounded border-gray-300"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!isDirty || isLoading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </form>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-600 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Delete workspace</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete a workspace, there is no going back. This will
                permanently delete all pages, databases, and remove all members.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete workspace
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-red-600">
                    Are you absolutely sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleDeleteWorkspace}
                      disabled={isLoading}
                    >
                      Yes, delete workspace
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
