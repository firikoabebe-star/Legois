"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";

interface CommentFormProps {
  onSubmit: (content: any) => Promise<void>;
  onCancel?: () => void;
  initialContent?: any;
  isSubmitting?: boolean;
  placeholder?: string;
}

export function CommentForm({
  onSubmit,
  onCancel,
  initialContent,
  isSubmitting = false,
  placeholder = "Add a comment...",
}: CommentFormProps) {
  const [content, setContent] = useState(() => {
    if (typeof initialContent === "string") {
      return initialContent;
    }
    if (initialContent?.text) {
      return initialContent.text;
    }
    return "";
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    try {
      await onSubmit({ text: content.trim() });
      if (!initialContent) {
        setContent("");
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
        disabled={isSubmitting}
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {onCancel ? "Press Escape to cancel" : "Press Cmd+Enter to send"}
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
          >
            <Send className="h-4 w-4 mr-1" />
            {isSubmitting ? "Sending..." : initialContent ? "Update" : "Send"}
          </Button>
        </div>
      </div>
    </form>
  );
}
