"use client";

import { useState } from "react";
import { Database, DatabaseView, DatabaseProperty } from "@/types";
import { useDatabaseStore } from "@/store/database.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PropertyCell } from "../property-cell";
import {
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  Filter,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TableViewProps {
  database: Database;
  view: DatabaseView;
  readOnly?: boolean;
}

export function TableView({
  database,
  view,
  readOnly = false,
}: TableViewProps) {
  const { createProperty, deleteRow } = useDatabaseStore();
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState("");

  const properties = (database as any).properties || [];
  const rows = (database as any).rows || [];

  const handleCreateProperty = async (type: string) => {
    if (readOnly || !newPropertyName.trim()) return;

    setIsCreatingProperty(true);
    try {
      await createProperty({
        name: newPropertyName,
        type,
        databaseId: database.id,
      });
      setNewPropertyName("");
    } catch (error) {
      console.error("Failed to create property:", error);
    } finally {
      setIsCreatingProperty(false);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (readOnly) return;

    if (confirm("Are you sure you want to delete this row?")) {
      try {
        await deleteRow(rowId);
      } catch (error) {
        console.error("Failed to delete row:", error);
      }
    }
  };

  const getRowValue = (row: any, propertyId: string) => {
    const value = row.values?.find((v: any) => v.propertyId === propertyId);
    if (!value) return null;

    // Extract the actual value based on property type
    const property = properties.find((p: any) => p.id === propertyId);
    if (!property) return null;

    switch (property.type) {
      case "text":
      case "email":
      case "phone":
      case "url":
        return value.value?.text || "";
      case "number":
        return value.value?.number || 0;
      case "checkbox":
        return value.value?.checked || false;
      case "date":
        return value.value?.date || null;
      case "select":
        return value.value?.select || null;
      case "multi_select":
        return value.value?.multi_select || [];
      default:
        return value.value?.text || "";
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-full">
        {/* Table Header */}
        <div className="sticky top-0 bg-background border-b border-border z-10">
          <div className="flex">
            {/* Row Actions Column */}
            <div className="w-12 flex-shrink-0 border-r border-border p-2">
              <div className="h-8 flex items-center justify-center">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Property Columns */}
            {properties.map((property: DatabaseProperty) => (
              <div
                key={property.id}
                className="min-w-[150px] max-w-[300px] flex-shrink-0 border-r border-border p-2"
              >
                <div className="flex items-center justify-between h-8">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {property.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {property.type}
                    </span>
                  </div>

                  {!readOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4" />
                          Sort
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Filter
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                          <Trash2 className="h-4 w-4" />
                          Delete property
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}

            {/* Add Property Column */}
            {!readOnly && (
              <div className="min-w-[150px] flex-shrink-0 p-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-start gap-2 text-muted-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      Add property
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <div className="p-2">
                      <Input
                        placeholder="Property name"
                        value={newPropertyName}
                        onChange={(e) => setNewPropertyName(e.target.value)}
                        className="mb-2"
                      />
                      <div className="space-y-1">
                        {[
                          { type: "text", label: "Text" },
                          { type: "number", label: "Number" },
                          { type: "select", label: "Select" },
                          { type: "multi_select", label: "Multi-select" },
                          { type: "date", label: "Date" },
                          { type: "checkbox", label: "Checkbox" },
                          { type: "url", label: "URL" },
                          { type: "email", label: "Email" },
                        ].map(({ type, label }) => (
                          <DropdownMenuItem
                            key={type}
                            onClick={() => handleCreateProperty(type)}
                            disabled={
                              isCreatingProperty || !newPropertyName.trim()
                            }
                            className="text-sm"
                          >
                            {label}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {rows.map((row: any, rowIndex: number) => (
            <div key={row.id} className="flex group hover:bg-accent/5">
              {/* Row Actions */}
              <div className="w-12 flex-shrink-0 border-r border-border p-2">
                <div className="h-8 flex items-center justify-center">
                  {!readOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onClick={() => handleDeleteRow(row.id)}
                          className="flex items-center gap-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete row
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Property Cells */}
              {properties.map((property: DatabaseProperty) => (
                <div
                  key={property.id}
                  className="min-w-[150px] max-w-[300px] flex-shrink-0 border-r border-border p-2"
                >
                  <PropertyCell
                    property={property}
                    value={getRowValue(row, property.id)}
                    rowId={row.id}
                    readOnly={readOnly}
                  />
                </div>
              ))}

              {/* Empty cells for add property column */}
              {!readOnly && (
                <div className="min-w-[150px] flex-shrink-0 p-2">
                  <div className="h-8" />
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {rows.length === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <p className="mb-2">No rows yet</p>
                <p className="text-sm">Click "New" to add your first row</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
