import { createClient } from "@/lib/supabase/client";
import type { Canvas, Note } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";

// Canvas CRUD
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCanvases(supabaseClient?: any) {
  const supabase = supabaseClient || createClient();
  const { data, error } = await supabase
    .from("canvases")
    .select("*, canvas_tags(tags(*))")
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return data.map((canvas: any) => ({
    ...canvas,
    tags: canvas.canvas_tags?.map((ct: any) => ct.tags) || [],
    canvas_tags: undefined
  })) as Canvas[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCanvas(id: string, supabaseClient?: any) {
  const supabase = supabaseClient || createClient();
  const { data, error } = await supabase
    .from("canvases")
    .select("*, canvas_tags(tags(*))")
    .eq("id", id)
    .single();

  if (error) throw error;

  return {
    ...data,
    tags: (data as any).canvas_tags?.map((ct: any) => ct.tags) || [],
    canvas_tags: undefined
  } as Canvas;
}

export async function createCanvas(title: string = "Untitled") {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("canvases")
    .insert({
      title,
      user_id: userData.user.id,
      content: {},
      view_mode: "canvas",
    })
    .select()
    .single();

  if (error) throw error;
  return data as Canvas;
}

export async function updateCanvas(
  id: string,
  updates: Partial<Pick<Canvas, "title" | "description" | "content" | "view_mode" | "is_archived">>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("canvases")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Canvas;
}

export async function deleteCanvas(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("canvases")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Notes CRUD
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getNotes(canvasId: string, supabaseClient?: any) {
  const supabase = supabaseClient || createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*, note_tags(tags(*))")
    .eq("canvas_id", canvasId)
    .order("z_index", { ascending: true });

  if (error) throw error;

  return data.map((note: any) => ({
    ...note,
    tags: note.note_tags?.map((nt: any) => nt.tags) || [],
    note_tags: undefined
  })) as Note[];
}

export async function createNote(
  canvasId: string,
  position?: { x: number; y: number }
) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("notes")
    .insert({
      canvas_id: canvasId,
      user_id: userData.user.id,
      title: "",
      content: {},
      position_x: position?.x ?? Math.random() * 400,
      position_y: position?.y ?? Math.random() * 300,
      width: 300,
      height: 200,
      color: "default",
      z_index: Date.now(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

export async function updateNote(
  id: string,
  updates: Partial<Pick<Note, "title" | "content" | "position_x" | "position_y" | "width" | "height" | "color" | "z_index">>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

export async function deleteNote(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function updateNotePosition(
  id: string,
  position: { x: number; y: number }
) {
  return updateNote(id, {
    position_x: position.x,
    position_y: position.y,
  });
}

export async function updateNoteSize(
  id: string,
  size: { width: number; height: number }
) {
  return updateNote(id, {
    width: size.width,
    height: size.height,
  });
}

export async function updateNoteContent(id: string, content: JSONContent) {
  return updateNote(id, { content });
}

export async function bringNoteToFront(id: string) {
  return updateNote(id, { z_index: Date.now() });
}

// Edges CRUD
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEdges(canvasId: string, supabaseClient?: any) {
  const supabase = supabaseClient || createClient();
  const { data, error } = await supabase
    .from("edges")
    .select("*")
    .eq("canvas_id", canvasId);

  if (error) throw error;
  return data;
}

export async function createEdge(
  canvasId: string,
  sourceId: string,
  targetId: string,
  sourceHandle?: string | null,
  targetHandle?: string | null
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("edges")
    .insert({
      canvas_id: canvasId,
      source_id: sourceId,
      target_id: targetId,
      source_handle: sourceHandle,
      target_handle: targetHandle,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEdge(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("edges")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
