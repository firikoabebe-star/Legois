"use client";

import { Block } from "@/types";

interface DividerBlockProps {
  block: Block;
  editable: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  isUpdating: boolean;
}

export function DividerBlock({ block, editable }: DividerBlockProps) {
  return (
    <div className="py-4">
      <hr className="border-border" />
    </div>
  );
}
