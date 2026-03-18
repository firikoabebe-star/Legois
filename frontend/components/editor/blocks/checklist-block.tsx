"use client";

import { useState, useEffect } from "react";
import { Block } from "@/types";
import { cn } from "@/lib/utils";
import { debounce } from "@/lib/utils";
import { Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistBlockProps {
  block: Block;
  editable: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  isUpdating: boolean;
}

export function ChecklistBlock({
  block,
  editable,
  onUpdate,
  isUpdating,
}: ChecklistBlockProps) {
  const [items, setItems] = useState<ChecklistItem[]>(
    block.content?.items || [{ id: "1", text: "", checked: false }],
  );

  const debouncedUpdate = debounce((newItems: ChecklistItem[]) => {
    onUpdate({
      content: { ...block.content, items: newItems },
    });
  }, 500);

  useEffect(() => {
    setItems(block.content?.items || [{ id: "1", text: "", checked: false }]);
  }, [block.content]);

  const handleItemChange = (id: string, text: string) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, text } : item,
    );
    setItems(newItems);
    debouncedUpdate(newItems);
  };

  const handleItemCheck = (id: string, checked: boolean) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, checked } : item,
    );
    setItems(newItems);
    debouncedUpdate(newItems);
  };

  const handleAddItem = () => {
    const newItem = { id: Date.now().toString(), text: "", checked: false };
    const newItems = [...items, newItem];
    setItems(newItems);
    debouncedUpdate(newItems);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    debouncedUpdate(newItems);
  };

  if (!editable) {
    return (
      <div className="py-2">
        <div className="space-y-2">
          {items
            .filter((item) => item.text.trim())
            .map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center",
                    item.checked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground",
                  )}
                >
                  {item.checked && <Check className="h-3 w-3" />}
                </div>
                <span
                  className={cn(
                    "text-foreground",
                    item.checked && "line-through text-muted-foreground",
                  )}
                >
                  {item.text}
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <button
              onClick={() => handleItemCheck(item.id, !item.checked)}
              className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                item.checked
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground hover:border-foreground",
              )}
            >
              {item.checked && <Check className="h-3 w-3" />}
            </button>
            <input
              type="text"
              value={item.text}
              onChange={(e) => handleItemChange(item.id, e.target.value)}
              placeholder="To-do item"
              className={cn(
                "flex-1 border-none outline-none bg-transparent",
                "text-foreground placeholder:text-muted-foreground",
                "focus:ring-0 focus:border-none",
                item.checked && "line-through text-muted-foreground",
                isUpdating && "opacity-70",
              )}
            />
            {items.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(item.id)}
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
