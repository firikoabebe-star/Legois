"use client";

import { useState } from "react";
import { Database } from "@/types";
import { useDatabaseStore } from "@/store/database.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit3, Trash2, Copy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatabaseHeaderProps {
  database: Database;
  readOnly?: boolean;
}

export function DatabaseHeader({
  database,
  readOnly = false,
}: DatabaseHeaderProps) {
  const { updateDatabase, deleteDatabase } = useDatabaseStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(database.name);
  const [description, setDescription] = useState(database.description || "");

  const handleSave = async () => {
    if (readOnly) return;

    try {
      await updateDatabase(database.id, {
        name: title,
        description: description || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update database:", error);
    }
  };

  const handleCancel = () => {
    setTitle(database.name);
    setDescription(database.description || "");
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (readOnly) return;

    if (
      confirm(
        "Are you sure you want to delete this database? This action cannot be undone.",
      )
    ) {
      try {
        await deleteDatabase(database.id);
      } catch (error) {
        console.error("Failed to delete database:", error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="p-6 border-b border-border">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {database.icon && <span className="text-2xl">{database.icon}</span>}

            {isEditing ? (
              <div className="flex-1">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSave}
                  className="text-2xl font-bold border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                  autoFocus
                />
              </div>
            ) : (
              <h1
                className={cn(
                  "text-2xl font-bold text-foreground truncate",
                  !readOnly &&
                    "cursor-pointer hover:bg-accent/10 rounded px-2 py-1 -mx-2 -my-1",
                )}
                onClick={() => !readOnly && setIsEditing(true)}
              >
                {database.name}
              </h1>
            )}
          </div>

          {(database.description || isEditing) && (
            <div className="mt-2">
              {isEditing ? (
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSave}
                  placeholder="Add a description..."
                  className="text-muted-foreground border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                />
              ) : (
                <p
                  className={cn(
                    "text-muted-foreground",
                    !readOnly &&
                      "cursor-pointer hover:bg-accent/10 rounded px-2 py-1 -mx-2 -my-1",
                  )}
                  onClick={() => !readOnly && setIsEditing(true)}
                >
                  {database.description}
                </p>
              )}
            </div>
          )}

          {/* Database Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span>{(database as any)._count?.rows || 0} rows</span>
            <span>{(database as any).properties?.length || 0} properties</span>
            <span>{(database as any).views?.length || 0} views</span>
          </div>
        </div>

        {/* Actions Menu */}
        {!readOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit database
              </DropdownMenuItem>

              <DropdownMenuItem className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Duplicate
              </DropdownMenuItem>

              <DropdownMenuItem className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Properties
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleDelete}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete database
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
