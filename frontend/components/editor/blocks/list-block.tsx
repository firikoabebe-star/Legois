"use client";

import { useState, useEffect } from "react";
import { Block } from "@/types";
import { cn } from "@/lib/utils";
import { debounce } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListBlockProps {
  block: Block;
  editable: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  isUpdating: boolean;
}

export function ListBlock({
  block,
  editable,
  onUpdate,
  isUpdating,
}: ListBlockProps) {
  const [items, setItems] = useState<string[]>(block.content?.items || [""]);
  const [listType, setListType] = useState<"bullet" | "numbered">(
    block.content?.type || "bullet",
  );

  const debouncedUpdate = debounce(
    (newItems: string[], newType: "bullet" | "numbered") => {
      onUpdate({
        content: { ...block.content, items: newItems, type: newType },
      });
    },
    500,
  );

  useEffect(() => {
    setItems(block.content?.items || [""]);
    setListType(block.content?.type || "bullet");
  }, [block.content]);

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
    debouncedUpdate(newItems, listType);
  };

  const handleAddItem = () => {
    const newItems = [...items, ""];
    setItems(newItems);
    debouncedUpdate(newItems, listType);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    debouncedUpdate(newItems, listType);
  };

  const handleTypeChange = (newType: "bullet" | "numbered") => {
    setListType(newType);
    debouncedUpdate(items, newType);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddItem();
    } else if (
      e.key === "Backspace" &&
      items[index] === "" &&
      items.length > 1
    ) {
      e.preventDefault();
      handleRemoveItem(index);
    }
  };

  if (!editable) {
    const ListTag = listType === "numbered" ? "ol" : "ul";
    return (
      <div className="py-2">
        <ListTag
          className={cn(
            "space-y-1",
            listType === "numbered"
              ? "list-decimal list-inside"
              : "list-disc list-inside",
          )}
        >
          {items
            .filter((item) => item.trim())
            .map((item, index) => (
              <li key={index} className="text-foreground leading-relaxed">
                {item}
              </li>
            ))}
        </ListTag>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex gap-1">
          <button
            onClick={() => handleTypeChange("bullet")}
            className={cn(
              "px-2 py-1 text-xs rounded border",
              listType === "bullet"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-muted",
            )}
          >
            • Bullet
          </button>
          <button
            onClick={() => handleTypeChange("numbered")}
            className={cn(
              "px-2 py-1 text-xs rounded border",
              listType === "numbered"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-muted",
            )}
          >
            1. Numbered
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-muted-foreground text-sm mt-0.5">
              {listType === "numbered" ? `${index + 1}.` : "•"}
            </div>
            <input
              type="text"
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              placeholder="List item"
              className={cn(
                "flex-1 border-none outline-none bg-transparent",
                "text-foreground placeholder:text-muted-foreground",
                "focus:ring-0 focus:border-none",
                isUpdating && "opacity-70",
              )}
            />
            {items.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(index)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddItem}
          className="text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add item
        </Button>
      </div>
    </div>
  );
}
