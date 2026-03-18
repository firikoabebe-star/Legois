"use client";

import { Database, DatabaseView } from "@/types";

interface BoardViewProps {
  database: Database;
  view: DatabaseView;
  readOnly?: boolean;
}

export function BoardView({
  database,
  view,
  readOnly = false,
}: BoardViewProps) {
  return (
    <div className="h-full p-6">
      <div className="text-center text-muted-foreground">
        <h3 className="text-lg font-medium mb-2">Board View</h3>
        <p>Kanban board view coming soon...</p>
        <p className="text-sm mt-2">
          This will display rows as cards grouped by a select property.
        </p>
      </div>
    </div>
  );
}
