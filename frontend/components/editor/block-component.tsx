"use client";

import { useState, useRef, useEffect } from "react";
import { Block, BlockType } from "@/types";
import { useBlockStore } from "@/store/block.store";
import { cn } from "@/lib/utils";
import { debounce } from "@/lib/utils";

interface BlockComponentProps {
  block: Block;
  isSelected: boolean;
  readOnly?: boolean;
  onSelect: () => void;
  onDeselect: () => void;
}

export function BlockComponent({
  block,
  isSelected,
  readOnly = false,
  onSelect,
  onDeselect,
}: BlockComponentProps) {
  const { updateBlock, deleteBlock } = useBlockStore();
  const [content, setContent] = useState(block.content);
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Debounced update function
  const debouncedUpdate = debounce(async (newContent: any) => {
    try {
      await updateBlock(block.id, { content: newContent });
    } catch (error) {
      console.error("Failed to update block:", error);
    }
  }, 500);

  useEffect(() => {
    if (JSON.stringify(content) !== JSON.stringify(block.content)) {
      debouncedUpdate(content);
    }
  }, [content, block.content, debouncedUpdate]);

  const handleContentChange = (newContent: any) => {
    setContent(newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return;

    // Handle Enter key
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Create new block logic would go here
    }

    // Handle Backspace on empty block
    if (e.key === "Backspace" && isEmpty(content)) {
      e.preventDefault();
      deleteBlock(block.id);
    }

    // Handle slash commands
    if (e.key === "/" && isEmpty(content)) {
      e.preventDefault();
      // Show block type selector
    }
  };

  const isEmpty = (content: any): boolean => {
    switch (block.type) {
      case "text":
      case "heading":
        return !content.text || content.text.trim() === "";
      case "list":
        return (
          !content.items ||
          content.items.length === 0 ||
          content.items.every((item: string) => !item.trim())
        );
      case "checklist":
        return (
          !content.items ||
          content.items.length === 0 ||
          content.items.every((item: any) => !item.text.trim())
        );
      case "code":
        return !content.code || content.code.trim() === "";
      case "quote":
        return !content.text || content.text.trim() === "";
      default:
        return false;
    }
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case "text":
        return (
          <TextBlock
            content={content}
            onChange={handleContentChange}
            readOnly={readOnly}
            isSelected={isSelected}
            onFocus={onSelect}
            onBlur={onDeselect}
            onKeyDown={handleKeyDown}
          />
        );

      case "heading":
        return (
          <HeadingBlock
            content={content}
            onChange={handleContentChange}
            readOnly={readOnly}
            isSelected={isSelected}
            onFocus={onSelect}
            onBlur={onDeselect}
            onKeyDown={handleKeyDown}
          />
        );

      case "list":
        return (
          <ListBlock
            content={content}
            onChange={handleContentChange}
            readOnly={readOnly}
            isSelected={isSelected}
            onFocus={onSelect}
            onBlur={onDeselect}
            onKeyDown={handleKeyDown}
          />
        );

      case "checklist":
        return (
          <ChecklistBlock
            content={content}
            onChange={handleContentChange}
            readOnly={readOnly}
            isSelected={isSelected}
            onFocus={onSelect}
            onBlur={onDeselect}
            onKeyDown={handleKeyDown}
          />
        );

      case "code":
        return (
          <CodeBlock
            content={content}
            onChange={handleContentChange}
            readOnly={readOnly}
            isSelected={isSelected}
            onFocus={onSelect}
            onBlur={onDeselect}
            onKeyDown={handleKeyDown}
          />
        );

      case "quote":
        return (
          <QuoteBlock
            content={content}
            onChange={handleContentChange}
            readOnly={readOnly}
            isSelected={isSelected}
            onFocus={onSelect}
            onBlur={onDeselect}
            onKeyDown={handleKeyDown}
          />
        );

      case "divider":
        return <DividerBlock />;

      default:
        return (
          <div className="text-muted-foreground italic">
            Unsupported block type: {block.type}
          </div>
        );
    }
  };

  return (
    <div
      data-block-id={block.id}
      className={cn(
        "block-container relative py-1",
        isSelected && "ring-2 ring-primary/20 rounded-md",
        !readOnly && "hover:bg-accent/5 rounded-md",
      )}
    >
      {renderBlockContent()}
    </div>
  );
}

// Individual block components
function TextBlock({
  content,
  onChange,
  readOnly,
  isSelected,
  onFocus,
  onBlur,
  onKeyDown,
}: any) {
  return (
    <div
      contentEditable={!readOnly}
      suppressContentEditableWarning
      className={cn(
        "block-content outline-none min-h-[1.5rem] py-1 px-2 rounded",
        !readOnly && "focus:bg-accent/10",
      )}
      data-placeholder="Type something..."
      onInput={(e) => onChange({ text: e.currentTarget.textContent || "" })}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      dangerouslySetInnerHTML={{ __html: content.text || "" }}
    />
  );
}

function HeadingBlock({
  content,
  onChange,
  readOnly,
  isSelected,
  onFocus,
  onBlur,
  onKeyDown,
}: any) {
  const level = content.level || 1;
  const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;

  return (
    <HeadingTag
      contentEditable={!readOnly}
      suppressContentEditableWarning
      className={cn(
        "block-content outline-none font-bold py-1 px-2 rounded",
        level === 1 && "text-3xl",
        level === 2 && "text-2xl",
        level === 3 && "text-xl",
        level >= 4 && "text-lg",
        !readOnly && "focus:bg-accent/10",
      )}
      data-placeholder={`Heading ${level}`}
      onInput={(e) =>
        onChange({ ...content, text: e.currentTarget.textContent || "" })
      }
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      dangerouslySetInnerHTML={{ __html: content.text || "" }}
    />
  );
}

function ListBlock({
  content,
  onChange,
  readOnly,
  isSelected,
  onFocus,
  onBlur,
  onKeyDown,
}: any) {
  const items = content.items || [""];
  const listType = content.type || "bullet";

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange({ ...content, items: newItems });
  };

  const ListTag = listType === "numbered" ? "ol" : "ul";

  return (
    <ListTag
      className={cn(
        "pl-6 space-y-1",
        listType === "numbered" ? "list-decimal" : "list-disc",
      )}
    >
      {items.map((item: string, index: number) => (
        <li key={index}>
          <div
            contentEditable={!readOnly}
            suppressContentEditableWarning
            className={cn(
              "block-content outline-none min-h-[1.5rem] py-1 px-2 rounded",
              !readOnly && "focus:bg-accent/10",
            )}
            data-placeholder="List item"
            onInput={(e) =>
              handleItemChange(index, e.currentTarget.textContent || "")
            }
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            dangerouslySetInnerHTML={{ __html: item }}
          />
        </li>
      ))}
    </ListTag>
  );
}

function ChecklistBlock({
  content,
  onChange,
  readOnly,
  isSelected,
  onFocus,
  onBlur,
  onKeyDown,
}: any) {
  const items = content.items || [{ text: "", checked: false }];

  const handleItemChange = (
    index: number,
    field: "text" | "checked",
    value: any,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...content, items: newItems });
  };

  return (
    <div className="space-y-2">
      {items.map((item: any, index: number) => (
        <div key={index} className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={item.checked || false}
            onChange={(e) =>
              handleItemChange(index, "checked", e.target.checked)
            }
            disabled={readOnly}
            className="mt-1 rounded border-gray-300"
          />
          <div
            contentEditable={!readOnly}
            suppressContentEditableWarning
            className={cn(
              "block-content outline-none min-h-[1.5rem] py-1 px-2 rounded flex-1",
              item.checked && "line-through text-muted-foreground",
              !readOnly && "focus:bg-accent/10",
            )}
            data-placeholder="To-do"
            onInput={(e) =>
              handleItemChange(index, "text", e.currentTarget.textContent || "")
            }
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            dangerouslySetInnerHTML={{ __html: item.text || "" }}
          />
        </div>
      ))}
    </div>
  );
}

function CodeBlock({
  content,
  onChange,
  readOnly,
  isSelected,
  onFocus,
  onBlur,
  onKeyDown,
}: any) {
  return (
    <div className="bg-muted rounded-lg p-4 font-mono text-sm">
      <div className="flex items-center justify-between mb-2">
        <select
          value={content.language || "javascript"}
          onChange={(e) => onChange({ ...content, language: e.target.value })}
          disabled={readOnly}
          className="text-xs bg-transparent border-none outline-none text-muted-foreground"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="json">JSON</option>
        </select>
      </div>
      <pre
        contentEditable={!readOnly}
        suppressContentEditableWarning
        className="outline-none whitespace-pre-wrap"
        data-placeholder="Enter code..."
        onInput={(e) =>
          onChange({ ...content, code: e.currentTarget.textContent || "" })
        }
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        dangerouslySetInnerHTML={{ __html: content.code || "" }}
      />
    </div>
  );
}

function QuoteBlock({
  content,
  onChange,
  readOnly,
  isSelected,
  onFocus,
  onBlur,
  onKeyDown,
}: any) {
  return (
    <blockquote className="border-l-4 border-primary/30 pl-4 italic">
      <div
        contentEditable={!readOnly}
        suppressContentEditableWarning
        className={cn(
          "block-content outline-none min-h-[1.5rem] py-1 px-2 rounded",
          !readOnly && "focus:bg-accent/10",
        )}
        data-placeholder="Quote"
        onInput={(e) => onChange({ text: e.currentTarget.textContent || "" })}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        dangerouslySetInnerHTML={{ __html: content.text || "" }}
      />
    </blockquote>
  );
}

function DividerBlock() {
  return (
    <div className="py-4">
      <hr className="border-border" />
    </div>
  );
}
