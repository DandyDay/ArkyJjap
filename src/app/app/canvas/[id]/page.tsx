import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CanvasHeader } from "@/components/canvas/canvas-header";
import { CanvasView } from "@/components/canvas/canvas-view";
import { DocumentView } from "@/components/canvas/document-view";
import type { Canvas, Note } from "@/lib/types";

interface CanvasPageProps {
  params: Promise<{ id: string }>;
}

export default async function CanvasPage({ params }: CanvasPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch canvas with tags
  const { data: canvas, error: canvasError } = await supabase
    .from("canvases")
    .select(`
      *,
      tags:canvas_tags(tag_id, tags(*))
    `)
    .eq("id", id)
    .single();

  if (canvasError || !canvas) {
    notFound();
  }

  // Fetch notes with tags
  const { data: notesData } = await supabase
    .from("notes")
    .select(`
      *,
      note_tags(tag_id, tags(*))
    `)
    .eq("canvas_id", id)
    .order("z_index", { ascending: true });

  // Transform data to match types
  const canvasWithTags: Canvas = {
    ...canvas,
    tags: canvas.tags?.map((t: any) => t.tags).filter(Boolean) || [],
  };

  const notesWithTags: Note[] = (notesData || []).map((note: any) => ({
    ...note,
    tags: note.note_tags?.map((nt: any) => nt.tags).filter(Boolean) || [],
    note_tags: undefined, // Remove the junction table data
  }));

  return (
    <div className="flex h-full flex-col">
      <CanvasHeader canvas={canvasWithTags} />
      <div className="flex-1">
        {canvas.view_mode === "canvas" ? (
          <CanvasView canvasId={id} initialNotes={notesWithTags} />
        ) : (
          <DocumentView canvasId={id} initialNotes={notesWithTags} />
        )}
      </div>
    </div>
  );
}
