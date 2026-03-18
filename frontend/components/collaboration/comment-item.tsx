"use client";

import { useState } from "react";
import { Comment } from "@/types";
import { useCommentStore } from "@/store/comment.store";
import { useAuthStore } from "@/store/auth.store";
import { CommentForm } from "./comment-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Reply,
  Edit3,
  Trash2,
  Check,
  MessageSquare,
} from "lucide-react";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CommentItemProps {
  comment: Comment;
  pageId?: string;
  blockId?: string;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  pageId,
  blockId,
  isReply = false,
}: CommentItemProps) {
  const { user } = useAuthStore();
  const { updateComment, deleteComment, resolveComment, createComment } =
    useCommentStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const isAuthor = user?.id === comment.authorId;
  const canEdit = isAuthor;
  const canDelete = isAuthor;
  const canResolve = !isReply && !comment.isResolved;

  const handleEdit = async (content: any) => {
    setIsUpdating(true);
    try {
      await updateComment(comment.id, { content });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update comment:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteComment(comment.id);
      } catch (error) {
        console.error("Failed to delete comment:", error);
      }
    }
  };

  const handleResolve = async () => {
    try {
      await resolveComment(comment.id);
    } catch (error) {
      console.error("Failed to resolve comment:", error);
    }
  };

  const handleReply = async (content: any) => {
    try {
      await createComment({
        content,
        pageId,
        blockId,
        parentId: comment.id,
      });
      setIsReplying(false);
    } catch (error) {
      console.error("Failed to create reply:", error);
    }
  };

  const getDisplayName = (author: any) => {
    if (author.firstName && author.lastName) {
      return `${author.firstName} ${author.lastName}`;
    }
    return author.username;
  };

  const renderContent = (content: any) => {
    if (typeof content === "string") {
      return content;
    }
    if (content?.text) {
      return content.text;
    }
    return "Comment content";
  };

  return (
    <div
      className={cn(
        "space-y-3",
        isReply && "ml-8 border-l-2 border-muted pl-4",
        comment.isResolved && "opacity-60",
      )}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.author.avatar ? (
            <img
              src={comment.author.avatar}
              alt={getDisplayName(comment.author)}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
              {getInitials(getDisplayName(comment.author))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {getDisplayName(comment.author)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
            {comment.isResolved && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3 w-3" />
                Resolved
              </div>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <CommentForm
              initialContent={comment.content}
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              isSubmitting={isUpdating}
              placeholder="Edit comment..."
            />
          ) : (
            <div className="text-sm text-foreground mb-2">
              {renderContent(comment.content)}
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-2">
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  className="h-6 px-2 text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}

              {canResolve && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResolve}
                  className="h-6 px-2 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Resolve
                </Button>
              )}

              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3">
              <CommentForm
                onSubmit={handleReply}
                onCancel={() => setIsReplying(false)}
                placeholder="Write a reply..."
              />
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="h-6 px-2 text-xs"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {showReplies ? "Hide" : "Show"} {comment.replies.length}{" "}
                  replies
                </Button>
              )}

              {showReplies &&
                comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    pageId={pageId}
                    blockId={blockId}
                    isReply={true}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
