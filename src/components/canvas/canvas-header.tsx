"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  MoreHorizontal,
  Layout,
  FileText,
  Archive,
  Trash2,
  Check,
} from "lucide-react";
import { updateCanvas, deleteCanvas } from "@/lib/api/canvases";
import { addTagToCanvas, removeTagFromCanvas } from "@/lib/api/tags";
import type { Canvas } from "@/lib/types";
import { TagSelector } from "@/components/tags/tag-selector";
import { ShareDialog } from "./share-dialog";


interface CanvasHeaderProps {
  canvas: Canvas;
}

export function CanvasHeader({ canvas }: CanvasHeaderProps) {
  const router = useRouter();
  const [title, setTitle] = useState(canvas.title);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"canvas" | "document">(canvas.view_mode);

  const handleTitleSave = useCallback(async () => {
    setIsEditing(false);
    if (title.trim() !== canvas.title) {
      await updateCanvas(canvas.id, { title: title.trim() || "Untitled" });
    }
  }, [canvas.id, canvas.title, title]);

  const handleViewModeChange = useCallback(async (mode: "canvas" | "document") => {
    setViewMode(mode);
    await updateCanvas(canvas.id, { view_mode: mode });
    router.refresh();
  }, [canvas.id, router]);

  const handleArchive = useCallback(async () => {
    await updateCanvas(canvas.id, { is_archived: true });
    router.push("/app/canvas");
  }, [canvas.id, router]);

  const handleDelete = useCallback(async () => {
    if (confirm("정말 이 캔버스를 삭제하시겠습니까?")) {
      await deleteCanvas(canvas.id);
      router.push("/app/canvas");
    }
  }, [canvas.id, router]);

  const handleTagToggle = useCallback(async (tagId: string) => {
    const hasTag = canvas.tags?.some((t) => t.id === tagId);
    if (hasTag) {
      await removeTagFromCanvas(canvas.id, tagId);
    } else {
      await addTagToCanvas(canvas.id, tagId);
    }
    router.refresh();
  }, [canvas.id, canvas.tags, router]);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/canvas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
              className="h-8 w-64"
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleTitleSave}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-lg font-semibold hover:bg-muted px-2 py-1 rounded transition-colors"
          >
            {title || "Untitled"}
          </button>
        )}

        <div className="ml-2">
          <TagSelector
            selectedTags={canvas.tags || []}
            onTagToggle={handleTagToggle}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* View mode toggle */}
        <div className="flex items-center rounded-lg border bg-muted p-1">
          <Button
            variant={viewMode === "canvas" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5"
            onClick={() => handleViewModeChange("canvas")}
          >
            <Layout className="h-3.5 w-3.5" />
            캔버스
          </Button>
          <Button
            variant={viewMode === "document" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5"
            onClick={() => handleViewModeChange("document")}
          >
            <FileText className="h-3.5 w-3.5" />
            문서
          </Button>
        </div>

        <ShareDialog canvasId={canvas.id} />

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild suppressHydrationWarning>
            <Button variant="ghost" size="icon" suppressHydrationWarning>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-2" />
              보관함으로 이동
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header >
  );
}
