"use client";

import { useState, useRef, useEffect } from "react";
import { Block } from "@/types";
import { cn } from "@/lib/utils";
import { debounce } from "@/lib/utils";

interface QuoteBlockProps {
  block: Block;
  editable: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  isUpdating: boolean;
}

export function QuoteBlock({
  block,
  editable,
  onUpdate,
  isUpdating,
}: QuoteBlockProps) {
  const [text, setText] = useState(block.content?.text || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      <div className="py-2">
        <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-foreground">
          {text || ""}
        </blockquote>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="border-l-4 border-muted-foreground/30 pl-4">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          placeholder="Quote something..."
          className={cn(
            "w-full resize-none border-none outline-none bg-transparent",
            "text-foreground placeholder:text-muted-foreground italic",
            "leading-relaxed min-h-[1.5rem]",
            "focus:ring-0 focus:border-none",
            isUpdating && "opacity-70",
          )}
          rows={1}
        />
      </div>
    </div>
  );
}
