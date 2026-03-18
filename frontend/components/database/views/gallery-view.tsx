"use client";

import { Database, DatabaseView } from "@/types";

interface GalleryViewProps {
  database: Database;
  view: DatabaseView;
  readOnly?: boolean;
}

export function GalleryView({
  database,
  view,
  readOnly = false,
}: GalleryViewProps) {
  return (
    <div className="h-full p-6">
      <div className="text-center text-muted-foreground">
        <h3 className="text-lg font-medium mb-2">Gallery View</h3>
        <p>Gallery view coming soon...</p>
        <p className="text-sm mt-2">
          This will display rows as cards in a grid layout with cover images.
        </p>
      </div>
    </div>
  );
}
