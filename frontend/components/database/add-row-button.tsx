"use client";

import { useState } from "react";
import { Database } from "@/types";
import { useDatabaseStore } from "@/store/database.store";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddRowButtonProps {
  database: Database;
}

export function AddRowButton({ database }: AddRowButtonProps) {
  const { createRow } = useDatabaseStore();
  const [isCreating, setIsCreating] = useState(false);

  const handleAddRow = async () => {
    setIsCreating(true);
    try {
      // Create default values for each property
      const defaultValues: Record<string, any> = {};

      (database as any).properties?.forEach((property: any) => {
        switch (property.type) {
          case "text":
          case "email":
          case "phone":
          case "url":
            defaultValues[property.id] = "";
            break;
          case "number":
            defaultValues[property.id] = 0;
            break;
          case "checkbox":
            defaultValues[property.id] = false;
            break;
          case "select":
            // Set to first option if available
            const firstOption = property.options?.options?.[0];
            defaultValues[property.id] = firstOption || null;
            break;
          case "multi_select":
            defaultValues[property.id] = [];
            break;
          case "date":
            defaultValues[property.id] = null;
            break;
          case "created_time":
          case "last_edited_time":
            defaultValues[property.id] = new Date().toISOString();
            break;
          default:
            defaultValues[property.id] = "";
        }
      });

      await createRow({
        databaseId: database.id,
        values: defaultValues,
      });
    } catch (error) {
      console.error("Failed to create row:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button onClick={handleAddRow} disabled={isCreating} className="gap-2">
      <Plus className="h-4 w-4" />
      {isCreating ? "Adding..." : "New"}
    </Button>
  );
}
