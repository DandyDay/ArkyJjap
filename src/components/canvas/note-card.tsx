"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, MoreHorizontal, Trash2, Palette, Edit2 } from "lucide-react";
import type { Note, NoteColor, Tag } from "@/lib/types";
import { NOTE_COLORS } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";
import { addTagToNote, removeTagFromNote } from "@/lib/api/tags";
import { TagSelector } from "@/components/tags/tag-selector";

interface NoteCardProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function NoteCard({
  note,
  onUpdate,
  onDelete,
  onBringToFront,
  isSelected,
  onSelect,
}: NoteCardProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({ x: note.position_x, y: note.position_y });
  const [size, setSize] = useState({ width: note.width, height: note.height });
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const colorClasses = NOTE_COLORS[note.color as NoteColor] || NOTE_COLORS.default;

  // Dragging
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    onBringToFront(note.id);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [note.id, onBringToFront, position]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onUpdate(note.id, { position_x: position.x, position_y: position.y });
    }
  }, [isDragging, note.id, onUpdate, position]);

  // Resizing
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  }, [size]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const dx = e.clientX - resizeStartRef.current.x;
    const dy = e.clientY - resizeStartRef.current.y;
    setSize({
      width: Math.max(200, resizeStartRef.current.width + dx),
      height: Math.max(100, resizeStartRef.current.height + dy),
    });
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      onUpdate(note.id, { width: size.width, height: size.height });
    }
  }, [isResizing, note.id, onUpdate, size]);

  // Event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const handleContentChange = useCallback((content: JSONContent) => {
    onUpdate(note.id, { content });
  }, [note.id, onUpdate]);

  const handleColorChange = useCallback((color: NoteColor) => {
    onUpdate(note.id, { color });
  }, [note.id, onUpdate]);

  const handleTagToggle = useCallback(async (tagId: string) => {
    const hasTag = note.tags?.some((t) => t.id === tagId);

    try {
      if (hasTag) {
        await removeTagFromNote(note.id, tagId);
      } else {
        await addTagToNote(note.id, tagId);
      }
      // Refresh server component to fetch updated tags
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle tag:", error);
    }
  }, [note.id, note.tags, router]);


  return (
    <div
      ref={cardRef}
      className={`group absolute rounded-xl border shadow-sm hover:shadow-md transition-all bg-card ${isSelected ? "ring-2 ring-brand shadow-xl" : ""
        } ${isDragging ? "cursor-grabbing shadow-2xl scale-[1.02]" : ""}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: note.z_index,
      }}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="group/header flex items-center justify-between px-3 pt-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 left-0 right-0 z-10">
        <div
          className="cursor-grab hover:bg-muted/50 rounded p-1"
          onMouseDown={handleDragStart}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1">
          <TagSelector
            selectedTags={note.tags || []}
            onTagToggle={handleTagToggle}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span>색상</span>
                </div>
              </DropdownMenuItem>
              <div className="flex gap-1 px-2 py-1">
                {(Object.keys(NOTE_COLORS) as NoteColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-5 h-5 rounded-full border-2 ${note.color === color ? "border-foreground" : "border-transparent"
                      } ${color === "default" ? "bg-card" : `bg-${color}-200 dark:bg-${color}-800`}`}
                    style={{
                      backgroundColor: color === "default" ? undefined :
                        color === "yellow" ? "#fef08a" :
                          color === "green" ? "#bbf7d0" :
                            color === "blue" ? "#bfdbfe" :
                              color === "purple" ? "#ddd6fe" :
                                color === "pink" ? "#fbcfe8" :
                                  color === "red" ? "#fecaca" :
                                    color === "orange" ? "#fed7aa" : undefined
                    }}
                  />
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(note.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tags Display */}
      {note.tags && note.tags.length > 0 && (
        <div className="px-3 pt-2 flex flex-wrap gap-1">
          {note.tags.map(tag => (
            <span
              key={tag.id}
              className="px-1.5 py-0.5 text-[10px] rounded-full border bg-background/50"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="p-4 pt-10 overflow-auto cursor-text"
        style={{ height: size.height - 50 }}
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <TiptapEditor
          content={note.content}
          onChange={handleContentChange}
          placeholder="노트를 작성하세요..."
          className="min-h-full"
        />
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeStart}
      >
        <svg
          className="w-4 h-4 text-muted-foreground/50"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
        </svg>
      </div>
    </div>
  );
}
