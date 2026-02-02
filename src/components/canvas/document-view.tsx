"use client";

import { useState, useCallback } from "react";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import type { Note } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";
import { createNote, updateNote, deleteNote } from "@/lib/api/canvases";

interface DocumentViewProps {
  canvasId: string;
  initialNotes: Note[];
}

export function DocumentView({ canvasId, initialNotes }: DocumentViewProps) {
  const [notes, setNotes] = useState<Note[]>(
    initialNotes.sort((a, b) => a.position_y - b.position_y)
  );

  const handleAddNote = useCallback(async () => {
    try {
      const newNote = await createNote(canvasId, { x: 0, y: notes.length * 100 });
      setNotes((prev) => [...prev, newNote]);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  }, [canvasId, notes.length]);

  const handleUpdateNote = useCallback(async (id: string, content: JSONContent) => {
    try {
      await updateNote(id, { content });
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? { ...note, content } : note))
      );
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  }, []);

  const handleDeleteNote = useCallback(async (id: string) => {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  }, []);

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-3xl p-8">
        {notes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              아직 노트가 없습니다. 새 노트를 추가해보세요.
            </p>
            <Button onClick={handleAddNote}>
              <Plus className="h-4 w-4 mr-2" />
              노트 추가
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {notes.map((note) => (
              <Card key={note.id} className="relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  onClick={() => handleDeleteNote(note.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
                <div className="p-4">
                  <TiptapEditor
                    content={note.content}
                    onChange={(content) => handleUpdateNote(note.id, content)}
                    placeholder="노트를 작성하세요..."
                  />
                </div>
              </Card>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddNote}
            >
              <Plus className="h-4 w-4 mr-2" />
              노트 추가
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
