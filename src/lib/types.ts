import type { JSONContent } from "@tiptap/react";

export interface Canvas {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content: JSONContent;
  view_mode: "canvas" | "document";
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Note {
  id: string;
  canvas_id: string;
  user_id: string;
  title: string;
  content: JSONContent;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  color: string;
  z_index: number;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Resource {
  id: string;
  user_id: string;
  canvas_id: string | null;
  type: "file" | "link" | "image";
  name: string;
  url: string | null;
  file_path: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EdgeData {
  id: string;
  canvas_id: string;
  source_id: string;
  target_id: string;
  source_handle: string | null;
  target_handle: string | null;
  created_at: string;
}

export type NoteColor =
  | "default"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "orange";

export const NOTE_COLORS: Record<NoteColor, { bg: string; border: string; hex: string }> = {
  default: { bg: "bg-card", border: "border-border", hex: "transparent" },
  yellow: { bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800", hex: "#fef9c3" }, // yellow-100
  green: { bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", hex: "#dcfce7" }, // green-100
  blue: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", hex: "#dbeafe" }, // blue-100
  purple: { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800", hex: "#f3e8ff" }, // purple-100
  pink: { bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-800", hex: "#fce7f3" }, // pink-100
  red: { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", hex: "#fee2e2" }, // red-100
  orange: { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", hex: "#ffedd5" }, // orange-100
};
