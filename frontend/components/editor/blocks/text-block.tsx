"use client";

import { useState, useRef, useEffect } from "react";
import { Block } from "@/types";
import { cn } from "@/lib/utils";
import { debounce } from "@/lib/utils";

interface TextBlockProps {
  block: Block;
  editable: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  isUpdating: boolean;
}

export function TextBlock({
  block,
  editable,
  onUpdate,
  isUpdating,
}: TextBlockProps) {
  const [text, setText] = useState(block.content?.text || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounced update function
  const debouncedUpdate = debounce((newText: string) => {
    onUpdate({
      content: { ...block.content, text: newText },
    });
  }, 500);

  useEffect(() => {
    setText(block.content?.text || "");
  }, [block.content?.text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    debouncedUpdate(newText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // TODO: Create new block below
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);

  if (!editable) {
    return (
      <div className="py-1">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
          {text || ""}
        </p>
      </div>
    );
  }

  return (
    <div className="py-1">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder="Type something..."
        className={cn(
          "w-full resize-none border-none outline-none bg-transparent",
          "text-foreground placeholder:text-muted-foreground",
          "leading-relaxed min-h-[1.5rem]",
          "focus:ring-0 focus:border-none",
          isUpdating && "opacity-70",
        )}
        rows={1}
      />
    </div>
  );
}
