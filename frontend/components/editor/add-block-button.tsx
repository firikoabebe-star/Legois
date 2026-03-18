"use client";

import { useState } from "react";
import { BlockType } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  CheckSquare,
  Code,
  Quote,
  Minus,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AddBlockButtonProps {
  position: number;
  onAddBlock: (type: BlockType, position: number) => void;
  variant?: "default" | "primary";
  className?: string;
}

export function AddBlockButton({
  position,
  onAddBlock,
  variant = "default",
  className,
}: AddBlockButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddBlock = (type: BlockType) => {
    onAddBlock(type, position);
    setIsOpen(false);
  };

  const blockTypes = [
    {
      type: "text" as BlockType,
      label: "Text",
      description: "Just start writing with plain text.",
      icon: Type,
    },
    {
      type: "heading" as BlockType,
      label: "Heading 1",
      description: "Big section heading.",
      icon: Heading1,
    },
    {
      type: "list" as BlockType,
      label: "Bulleted list",
      description: "Create a simple bulleted list.",
      icon: List,
    },
    {
      type: "checklist" as BlockType,
      label: "To-do list",
      description: "Track tasks with a to-do list.",
      icon: CheckSquare,
    },
    {
      type: "code" as BlockType,
      label: "Code",
      description: "Capture a code snippet.",
      icon: Code,
    },
    {
      type: "quote" as BlockType,
      label: "Quote",
      description: "Capture a quote.",
      icon: Quote,
    },
    {
      type: "divider" as BlockType,
      label: "Divider",
      description: "Visually divide blocks.",
      icon: Minus,
    },
  ];

  if (variant === "primary") {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add a block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-80">
          <div className="p-2">
            <div className="text-sm font-medium mb-2">Basic blocks</div>
            {blockTypes.map(({ type, label, description, icon: Icon }) => (
              <DropdownMenuItem
                key={type}
                onClick={() => handleAddBlock(type)}
                className="flex items-start gap-3 p-3 cursor-pointer"
              >
                <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-muted-foreground">
                    {description}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("flex justify-center py-2", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-80">
          <div className="p-2">
            <div className="text-sm font-medium mb-2">Basic blocks</div>
            {blockTypes.map(({ type, label, description, icon: Icon }) => (
              <DropdownMenuItem
                key={type}
                onClick={() => handleAddBlock(type)}
                className="flex items-start gap-3 p-3 cursor-pointer"
              >
                <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-muted-foreground">
                    {description}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
