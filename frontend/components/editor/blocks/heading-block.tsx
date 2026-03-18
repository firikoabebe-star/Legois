"use client";

import { useState, useRef, useEffect } from "react";
import { Block } from "@/types";
import { cn } from "@/lib/utils";
import { debounce } from "@/lib/utils";

interface HeadingBlockProps {
  block: Block;
  editable: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  isUpdating: boolean;
}

export function HeadingBlock({
  block,
  editable,
  onUpdate,
  isUpdating,
}: HeadingBlockProps) {
  const [text, setText] = useState(block.content?.text || "");
  const [level, setLevel] = useState(block.content?.level || 1);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedUpdate = debounce((newText: string, newLevel: number) => {
    onUpdate({
      content: { ...block.content, text: newText, level: newLevel },
    });
  }, 500);

  useEffect(() => {
    setText(block.content?.text || "");
    setLevel(block.content?.level || 1);
  }, [block.content]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    debouncedUpdate(newText, level);
  };

  const handleLevelChange = (newLevel: number) => {
    setLevel(newLevel);
    debouncedUpdate(text, newLevel);
  };

  const getHeadingClasses = (level: number) => {
    switch (level) {
      case 1:
        return "text-3xl font-bold";
      case 2:
        return "text-2xl font-semibold";
      case 3:
        return "text-xl font-medium";
      default:
        return "text-lg font-medium";
    }
  };

  if (!editable) {
    const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
    return (
      <div className="py-2">
        <HeadingTag className={cn(getHeadingClasses(level), "text-foreground")}>
          {text || ""}
        </HeadingTag>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex gap-1">
          {[1, 2, 3].map((h) => (
            <button
              key={h}
              onClick={() => handleLevelChange(h)}
              className={cn(
                "px-2 py-1 text-xs rounded border",
                level === h
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted",
              )}
            >
              H{h}
            </button>
          ))}
        </div>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={handleTextChange}
        placeholder={`Heading ${level}`}
        className={cn(
          "w-full border-none outline-none bg-transparent",
          getHeadingClasses(level),
          "text-foreground placeholder:text-muted-foreground",
          "focus:ring-0 focus:border-none",
          isUpdating && "opacity-70",
        )}
      />
    </div>
  );
}
