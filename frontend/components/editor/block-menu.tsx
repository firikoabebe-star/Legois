"use client";

import { useState } from "react";
import { Block, BlockType } from "@/types";
import { useBlockStore } from "@/store/block.store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  CheckSquare,
  Code,
  Quote,
  Minus,
  MoreHorizontal,
  Copy,
  Trash2,
  MoveUp,
  MoveDown,
} from "lucide-react";

interface BlockMenuProps {
  block: Block;
  onAddBlock: (type: BlockType) => void;
}

export function BlockMenu({ block, onAddBlock }: BlockMenuProps) {
  const { updateBlock, deleteBlock, duplicateBlock } = useBlockStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleChangeType = async (type: BlockType) => {
    try {
      const newContent = getContentForType(type, block.content);
      await updateBlock(block.id, { type, content: newContent });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to change block type:", error);
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateBlock(block.id);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to duplicate block:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBlock(block.id);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
  };

  const getContentForType = (type: BlockType, currentContent: any): any => {
    const text = extractText(currentContent);

    switch (type) {
      case "text":
        return { text };
      case "heading":
        return { text, level: 1 };
      case "list":
        return { type: "bullet", items: text ? [text] : [""] };
      case "checklist":
        return {
          items: text
            ? [{ text, checked: false }]
            : [{ text: "", checked: false }],
        };
      case "code":
        return { code: text, language: "javascript" };
      case "quote":
        return { text };
      case "divider":
        return {};
      default:
        return { text };
    }
  };

  const extractText = (content: any): string => {
    if (typeof content === "string") return content;
    if (content?.text) return content.text;
    if (content?.code) return content.code;
    if (content?.items) {
      if (Array.isArray(content.items) && content.items.length > 0) {
        const firstItem = content.items[0];
        return typeof firstItem === "string"
          ? firstItem
          : firstItem?.text || "";
      }
    }
    return "";
  };

  const blockTypes = [
    { type: "text" as BlockType, label: "Text", icon: Type },
    { type: "heading" as BlockType, label: "Heading 1", icon: Heading1 },
    { type: "list" as BlockType, label: "Bulleted List", icon: List },
    { type: "checklist" as BlockType, label: "To-do List", icon: CheckSquare },
    { type: "code" as BlockType, label: "Code", icon: Code },
    { type: "quote" as BlockType, label: "Quote", icon: Quote },
    { type: "divider" as BlockType, label: "Divider", icon: Minus },
  ];

  return (
    <div className="flex items-center gap-1">
      {/* Block Type Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Type className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {blockTypes.map(({ type, label, icon: Icon }) => (
            <DropdownMenuItem
              key={type}
              onClick={() => handleChangeType(type)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Block Actions */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={handleDuplicate}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleDelete}
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
