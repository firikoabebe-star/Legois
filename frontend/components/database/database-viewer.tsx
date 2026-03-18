"use client";

import { useEffect, useState } from "react";
import { useDatabaseStore } from "@/store/database.store";
import { Database, DatabaseView } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableView } from "./views/table-view";
import { BoardView } from "./views/board-view";
import { CalendarView } from "./views/calendar-view";
import { GalleryView } from "./views/gallery-view";
import { DatabaseHeader } from "./database-header";
import { AddRowButton } from "./add-row-button";
import {
  Table,
  Kanban,
  Calendar,
  Grid3X3,
  List,
  ChevronDown,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DatabaseViewerProps {
  databaseId: string;
  readOnly?: boolean;
}

export function DatabaseViewer({
  databaseId,
  readOnly = false,
}: DatabaseViewerProps) {
  const {
    currentDatabase,
    currentView,
    fetchDatabase,
    setCurrentView,
    createView,
    isLoading,
    error,
  } = useDatabaseStore();

  const [isCreatingView, setIsCreatingView] = useState(false);

  useEffect(() => {
    if (databaseId) {
      fetchDatabase(databaseId);
    }
  }, [databaseId, fetchDatabase]);

  const handleViewChange = (view: DatabaseView) => {
    setCurrentView(view);
  };

  const handleCreateView = async (type: string) => {
    if (readOnly || !currentDatabase) return;

    setIsCreatingView(true);
    try {
      const newView = await createView({
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} View`,
        type: type as any,
        config: getDefaultViewConfig(type),
        databaseId: currentDatabase.id,
      });
      setCurrentView(newView);
    } catch (error) {
      console.error("Failed to create view:", error);
    } finally {
      setIsCreatingView(false);
    }
  };

  const getDefaultViewConfig = (type: string) => {
    switch (type) {
      case "board":
        return {
          groupBy:
            (currentDatabase as any)?.properties?.find(
              (p: any) => p.type === "select",
            )?.id || null,
          filters: [],
          sorts: [],
        };
      case "calendar":
        return {
          dateProperty:
            (currentDatabase as any)?.properties?.find(
              (p: any) => p.type === "date",
            )?.id || null,
          filters: [],
          sorts: [],
        };
      case "gallery":
        return {
          coverProperty: null,
          cardSize: "medium",
          filters: [],
          sorts: [],
        };
      default:
        return {
          filters: [],
          sorts: [],
          groupBy: null,
        };
    }
  };

  const getViewIcon = (type: string) => {
    switch (type) {
      case "table":
        return Table;
      case "board":
        return Kanban;
      case "calendar":
        return Calendar;
      case "gallery":
        return Grid3X3;
      case "list":
        return List;
      default:
        return Table;
    }
  };

  const renderCurrentView = () => {
    if (!currentDatabase || !currentView) return null;

    switch (currentView.type) {
      case "table":
        return (
          <TableView
            database={currentDatabase}
            view={currentView}
            readOnly={readOnly}
          />
        );
      case "board":
        return (
          <BoardView
            database={currentDatabase}
            view={currentView}
            readOnly={readOnly}
          />
        );
      case "calendar":
        return (
          <CalendarView
            database={currentDatabase}
            view={currentView}
            readOnly={readOnly}
          />
        );
      case "gallery":
        return (
          <GalleryView
            database={currentDatabase}
            view={currentView}
            readOnly={readOnly}
          />
        );
      case "list":
        return (
          <TableView
            database={currentDatabase}
            view={currentView}
            readOnly={readOnly}
          />
        );
      default:
        return (
          <TableView
            database={currentDatabase}
            view={currentView}
            readOnly={readOnly}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading database...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading database</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentDatabase) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Database not found</div>
      </div>
    );
  }

  const views = (currentDatabase as any).views || [];

  return (
    <div className="h-full flex flex-col">
      {/* Database Header */}
      <DatabaseHeader database={currentDatabase} readOnly={readOnly} />

      {/* View Controls */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          {/* View Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                {currentView && (
                  <>
                    {(() => {
                      const Icon = getViewIcon(currentView.type);
                      return <Icon className="h-4 w-4" />;
                    })()}
                    {currentView.name}
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {views.map((view: DatabaseView) => {
                const Icon = getViewIcon(view.type);
                return (
                  <DropdownMenuItem
                    key={view.id}
                    onClick={() => handleViewChange(view)}
                    className={cn(
                      "flex items-center gap-2",
                      currentView?.id === view.id && "bg-accent",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {view.name}
                  </DropdownMenuItem>
                );
              })}

              {!readOnly && (
                <>
                  <div className="border-t border-border my-1" />
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    Add View
                  </div>
                  {["table", "board", "calendar", "gallery"].map((type) => {
                    const Icon = getViewIcon(type);
                    return (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => handleCreateView(type)}
                        disabled={isCreatingView}
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </DropdownMenuItem>
                    );
                  })}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Add Row Button */}
        {!readOnly && <AddRowButton database={currentDatabase} />}
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden">{renderCurrentView()}</div>
    </div>
  );
}
