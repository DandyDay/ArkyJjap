"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { NoteCard } from "./note-card";
import { Button } from "@/components/ui/button";
import { Plus, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { Note } from "@/lib/types";
import { createNote, updateNote, deleteNote, bringNoteToFront } from "@/lib/api/canvases";

interface CanvasViewProps {
  canvasId: string;
  initialNotes: Note[];
}

export function CanvasView({ canvasId, initialNotes }: CanvasViewProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Add new note
  const handleAddNote = useCallback(async () => {
    const centerX = (window.innerWidth / 2 - pan.x) / zoom - 150;
    const centerY = (window.innerHeight / 2 - pan.y) / zoom - 100;

    try {
      const newNote = await createNote(canvasId, { x: centerX, y: centerY });
      setNotes((prev) => [...prev, newNote]);
      setSelectedNoteId(newNote.id);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  }, [canvasId, pan, zoom]);

  // Update note
  const handleUpdateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    try {
      await updateNote(id, updates);
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? { ...note, ...updates } : note))
      );
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  }, []);

  // Delete note
  const handleDeleteNote = useCallback(async (id: string) => {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  }, [selectedNoteId]);

  // Bring note to front
  const handleBringToFront = useCallback(async (id: string) => {
    try {
      const newZIndex = Date.now();
      await bringNoteToFront(id);
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, z_index: newZIndex } : note
        )
      );
    } catch (error) {
      console.error("Failed to bring note to front:", error);
    }
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains("canvas-background")) {
      setIsPanning(true);
      setSelectedNoteId(null);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPan({
      x: panStartRef.current.panX + dx,
      y: panStartRef.current.panY + dy,
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 2));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false });
      return () => canvas.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

  // Double-click to add note
  const handleDoubleClick = useCallback(async (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains("canvas-background")) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - pan.x) / zoom - 150;
      const y = (e.clientY - rect.top - pan.y) / zoom - 100;

      try {
        const newNote = await createNote(canvasId, { x, y });
        setNotes((prev) => [...prev, newNote]);
        setSelectedNoteId(newNote.id);
      } catch (error) {
        console.error("Failed to create note:", error);
      }
    }
  }, [canvasId, pan, zoom]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted/30">
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <Button onClick={handleAddNote} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          노트 추가
        </Button>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-50 flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center text-sm text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleResetView}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas area */}
      <div
        ref={canvasRef}
        className={`h-full w-full ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Grid background */}
        <div
          className="canvas-background absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--border) 1px, transparent 1px),
              linear-gradient(to bottom, var(--border) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* Notes container */}
        <div
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              onBringToFront={handleBringToFront}
              isSelected={selectedNoteId === note.id}
              onSelect={() => setSelectedNoteId(note.id)}
            />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {notes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">
              더블클릭하거나 버튼을 눌러 노트를 추가하세요
            </p>
            <Button onClick={handleAddNote} className="pointer-events-auto">
              <Plus className="h-4 w-4 mr-2" />
              첫 번째 노트 추가
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
