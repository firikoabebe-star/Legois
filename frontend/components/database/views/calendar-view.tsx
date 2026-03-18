"use client";

import { Database, DatabaseView } from "@/types";

interface CalendarViewProps {
  database: Database;
  view: DatabaseView;
  readOnly?: boolean;
}

export function CalendarView({
  database,
  view,
  readOnly = false,
}: CalendarViewProps) {
  return (
    <div className="h-full p-6">
      <div className="text-center text-muted-foreground">
        <h3 className="text-lg font-medium mb-2">Calendar View</h3>
        <p>Calendar view coming soon...</p>
        <p className="text-sm mt-2">
          This will display rows on a calendar based on date properties.
        </p>
      </div>
    </div>
  );
}
