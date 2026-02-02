import { createClient } from "@/lib/supabase/client";
import type { Tag } from "@/lib/types";

export async function getTags() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data as Tag[];
}

export async function createTag(name: string, color: string = "#6366f1") {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("tags")
    .insert({
      name,
      color,
      user_id: userData.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Tag;
}

export async function deleteTag(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Canvas Tags
export async function getCanvasTags(canvasId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("canvas_tags")
    .select("tag_id, tags(*)")
    .eq("canvas_id", canvasId);

  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data?.map((item: any) => item.tags) as Tag[];
}

export async function addTagToCanvas(canvasId: string, tagId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("canvas_tags")
    .insert({
      canvas_id: canvasId,
      tag_id: tagId,
    });

  if (error) throw error;
}

export async function removeTagFromCanvas(canvasId: string, tagId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("canvas_tags")
    .delete()
    .eq("canvas_id", canvasId)
    .eq("tag_id", tagId);

  if (error) throw error;
}

// Note Tags
export async function getNoteTags(noteId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("note_tags")
    .select("tag_id, tags(*)")
    .eq("note_id", noteId);

  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data?.map((item: any) => item.tags) as Tag[];
}

export async function addTagToNote(noteId: string, tagId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("note_tags")
    .insert({
      note_id: noteId,
      tag_id: tagId,
    });

  if (error) throw error;
}

export async function removeTagFromNote(noteId: string, tagId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId)
    .eq("tag_id", tagId);

  if (error) throw error;
}
