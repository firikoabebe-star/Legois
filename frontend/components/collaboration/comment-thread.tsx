"use client";

import { useState, useEffect } from "react";
import { useCommentStore } from "@/store/comment.store";
import { useAuthStore } from "@/store/auth.store";
import { Comment } from "@/types";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentThreadProps {
  pageId?: string;
  blockId?: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function CommentThread({
  pageId,
  blockId,
  isOpen,
  onClose,
  className,
}: CommentThreadProps) {
  const { user } = useAuthStore();
  const {
    comments,
    isLoading,
    error,
    fetchPageComments,
    fetchBlockComments,
    createComment,
    clearComments,
  } = useCommentStore();

  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (pageId) {
        fetchPageComments(pageId);
      } else if (blockId) {
        fetchBlockComments(blockId);
      }
    } else {
      clearComments();
    }
  }, [
    isOpen,
    pageId,
    blockId,
    fetchPageComments,
    fetchBlockComments,
    clearComments,
  ]);

  const handleCreateComment = async (content: any) => {
    if (!user) return;

    setIsCreating(true);
    try {
      await createComment({
        content,
        pageId,
        blockId,
      });
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-lg z-50 flex flex-col",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Comments</h3>
          {comments.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading comments...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-destructive mb-2">Error loading comments</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No comments yet</p>
                <p className="text-sm text-muted-foreground">
                  Start a conversation
                </p>
              </div>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                pageId={pageId}
                blockId={blockId}
              />
            ))
          )}
        </div>

        {/* Comment Form */}
        <div className="border-t border-border p-4">
          <CommentForm
            onSubmit={handleCreateComment}
            isSubmitting={isCreating}
            placeholder="Add a comment..."
          />
        </div>
      </div>
    </div>
  );
}
