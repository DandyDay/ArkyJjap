import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CanvasView } from "@/components/canvas/canvas-view";
import { DocumentView } from "@/components/canvas/document-view";
import { CanvasLayout } from "@/components/canvas/canvas-layout";
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

  // Fetch edges
  const { data: edgesData } = await supabase
    .from("edges")
    .select("*")
    .eq("canvas_id", id);

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

  const initialEdges = (edgesData || []).map((edge: any) => ({
    id: edge.id,
    source: edge.source_id,
    target: edge.target_id,
    sourceHandle: edge.source_handle,
    targetHandle: edge.target_handle,
    type: "smoothstep", // Default edge type
    animated: true,
  }));

  return (
    <CanvasLayout canvas={canvasWithTags} notes={notesWithTags}>
      {canvas.view_mode === "canvas" ? (
        <CanvasView canvasId={id} initialNotes={notesWithTags} initialEdges={initialEdges} />
      ) : (
        <DocumentView canvasId={id} initialNotes={notesWithTags} />
      )}
    </CanvasLayout>
  );
}
