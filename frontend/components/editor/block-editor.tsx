"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useBlockStore } from "@/store/block.store";
import { usePageStore } from "@/store/page.store";
import { Block, BlockType } from "@/types";
import { BlockComponent } from "./block-component";
import { BlockMenu } from "./block-menu";
import { AddBlockButton } from "./add-block-button";
import { cn } from "@/lib/utils";

interface BlockEditorProps {
  pageId: string;
  readOnly?: boolean;
}

export function BlockEditor({ pageId, readOnly = false }: BlockEditorProps) {
  const {
    blocks,
    selectedBlockId,
    fetchPageBlocks,
    moveBlock,
    setSelectedBlock,
    createBlock,
  } = useBlockStore();

  const { currentPage } = usePageStore();
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (pageId) {
      fetchPageBlocks(pageId);
    }
  }, [pageId, fetchPageBlocks]);

  const handleDragStart = (result: any) => {
    setDraggedBlockId(result.draggableId);
  };

  const handleDragEnd = async (result: any) => {
    setDraggedBlockId(null);

    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const blockId = result.draggableId;

    try {
      await moveBlock(blockId, {
        position: destinationIndex,
      });
    } catch (error) {
      console.error("Failed to move block:", error);
    }
  };

  const handleAddBlock = async (type: BlockType, position: number) => {
    if (readOnly) return;

    try {
      const newBlock = await createBlock({
        type,
        content: getDefaultContent(type),
        position,
        pageId,
      });

      // Focus the new block
      setTimeout(() => {
        setSelectedBlock(newBlock.id);
        const element = document.querySelector(
          `[data-block-id="${newBlock.id}"]`,
        );
        if (element) {
          (element as HTMLElement).focus();
        }
      }, 100);
    } catch (error) {
      console.error("Failed to create block:", error);
    }
  };

  const getDefaultContent = (type: BlockType): any => {
    switch (type) {
      case "text":
        return { text: "" };
      case "heading":
        return { text: "", level: 1 };
      case "list":
        return { type: "bullet", items: [""] };
      case "checklist":
        return { items: [{ text: "", checked: false }] };
      case "code":
        return { code: "", language: "javascript" };
      case "quote":
        return { text: "" };
      case "divider":
        return {};
      default:
        return { text: "" };
    }
  };

  if (!currentPage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading page...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {currentPage.icon && (
            <span className="text-4xl">{currentPage.icon}</span>
          )}
          <h1 className="text-4xl font-bold text-foreground">
            {currentPage.title}
          </h1>
        </div>

        {currentPage.cover && (
          <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
            <img
              src={currentPage.cover}
              alt="Page cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Block Editor */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "min-h-[200px] space-y-1",
                snapshot.isDraggingOver && "bg-accent/20 rounded-lg",
              )}
            >
              {blocks.map((block, index) => (
                <Draggable
                  key={block.id}
                  draggableId={block.id}
                  index={index}
                  isDragDisabled={readOnly}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        "group relative",
                        snapshot.isDragging && "opacity-50",
                        draggedBlockId === block.id && "z-50",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {/* Drag Handle */}
                        {!readOnly && (
                          <div
                            {...provided.dragHandleProps}
                            className="block-handle flex items-center justify-center w-6 h-6 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                          >
                            <svg
                              className="w-4 h-4 text-muted-foreground"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zM7 8a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zM7 14a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zM13 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 2zM13 8a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zM13 14a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                            </svg>
                          </div>
                        )}

                        {/* Block Content */}
                        <div className="flex-1 min-w-0">
                          <BlockComponent
                            block={block}
                            isSelected={selectedBlockId === block.id}
                            readOnly={readOnly}
                            onSelect={() => setSelectedBlock(block.id)}
                            onDeselect={() => setSelectedBlock(null)}
                          />
                        </div>

                        {/* Block Menu */}
                        {!readOnly && selectedBlockId === block.id && (
                          <BlockMenu
                            block={block}
                            onAddBlock={(type) =>
                              handleAddBlock(type, index + 1)
                            }
                          />
                        )}
                      </div>

                      {/* Add Block Button */}
                      {!readOnly && (
                        <AddBlockButton
                          position={index + 1}
                          onAddBlock={handleAddBlock}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Empty State */}
              {blocks.length === 0 && !readOnly && (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    Start writing or press "/" for commands
                  </p>
                  <AddBlockButton
                    position={0}
                    onAddBlock={handleAddBlock}
                    variant="primary"
                  />
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
