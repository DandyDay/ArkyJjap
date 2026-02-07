"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Search, FileText, Plus, ArrowRight, CornerDownLeft } from "lucide-react";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Note } from "@/lib/types";

interface CommandMenuProps {
  notes?: Note[];
  onSelectNote?: (noteId: string) => void;
  onCreateNote?: () => void;
}

export function CommandMenu({ notes = [], onSelectNote, onCreateNote }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    setQuery("");
    command();
  }, []);

  const filteredNotes = React.useMemo(() => {
    if (!query.trim()) return [];

    return notes
      .map((note) => {
        const fullText = extractFullText(note.content);
        const title = extractTitle(note.content) || "제목 없는 노트";
        const matchIndex = fullText.toLowerCase().indexOf(query.toLowerCase());
        if (matchIndex === -1) return null;

        const start = Math.max(0, matchIndex - 20);
        const end = Math.min(fullText.length, matchIndex + query.length + 60);
        let snippet = fullText.slice(start, end);
        if (start > 0) snippet = "..." + snippet;
        if (end < fullText.length) snippet = snippet + "...";

        return { ...note, title, snippet };
      })
      .filter(
        (n): n is Note & { title: string; snippet: string } => n !== null
      );
  }, [notes, query]);

  const hasQuery = query.trim().length > 0;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQuery("");
      }}
      label="Canvas Command Menu"
      shouldFilter={false}
      className="fixed top-[22vh] left-1/2 -translate-x-1/2 w-[560px] max-w-[calc(100vw-2rem)] rounded-2xl border border-black/[0.08] bg-white shadow-[0_16px_70px_-12px_rgba(0,0,0,0.25)] dark:border-white/[0.08] dark:bg-[#0f0f10] dark:shadow-[0_16px_70px_-12px_rgba(0,0,0,0.7)] z-[100] overflow-hidden p-0 animate-in fade-in-0 zoom-in-[0.98] duration-150"
    >
      <DialogTitle className="sr-only">노트 검색</DialogTitle>
      <DialogDescription className="sr-only">
        노트의 제목이나 내용을 검색합니다.
      </DialogDescription>

      {/* Search Input */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Search className="h-[18px] w-[18px] shrink-0 text-black/25 dark:text-white/25" />
        <Command.Input
          placeholder="노트 검색..."
          value={query}
          onValueChange={setQuery}
          className="flex-1 bg-transparent text-[15px] font-light tracking-[-0.01em] outline-none placeholder:text-black/30 dark:placeholder:text-white/25 border-none focus:ring-0 p-0"
        />
        {hasQuery && (
          <span className="text-[11px] text-black/30 dark:text-white/20 tabular-nums">
            {filteredNotes.length}건
          </span>
        )}
      </div>

      {hasQuery && (
        <>
          <div className="h-px bg-black/[0.06] dark:bg-white/[0.06]" />

          <Command.List className="max-h-[min(360px,50vh)] overflow-y-auto overscroll-contain">
            <div className="p-1.5">
              {filteredNotes.length > 0 ? (
                <div>
                  <GroupLabel>검색 결과 {filteredNotes.length}건</GroupLabel>
                  {filteredNotes.map((note) => (
                    <CommandItem
                      key={note.id}
                      onSelect={() =>
                        runCommand(() => onSelectNote?.(note.id))
                      }
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
                        <FileText className="h-3.5 w-3.5 text-black/30 dark:text-white/30" />
                      </div>
                      <div className="flex flex-1 flex-col gap-1 overflow-hidden min-w-0">
                        <span className="text-[12px] font-medium text-black/55 dark:text-white/50 truncate">
                          {note.title}
                        </span>
                        <div className="text-[13px] leading-relaxed">
                          <HighlightedText
                            text={note.snippet}
                            query={query}
                          />
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-10 text-center">
                  <Search className="h-5 w-5 text-black/15 dark:text-white/10" />
                  <p className="text-[13px] text-black/35 dark:text-white/25">
                    결과 없음
                  </p>
                </div>
              )}
            </div>
          </Command.List>

          {/* Footer */}
          <div className="h-px bg-black/[0.06] dark:bg-white/[0.06]" />
          <div className="flex items-center px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-black/25 dark:text-white/20">
                <CornerDownLeft className="h-3 w-3" /> 이동
              </span>
              <span className="flex items-center gap-1 text-[11px] text-black/25 dark:text-white/20">
                <span className="font-mono text-[10px]">esc</span> 닫기
              </span>
            </div>
          </div>
        </>
      )}
    </Command.Dialog>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-black/25 dark:text-white/20">
      {children}
    </div>
  );
}

function CommandItem({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="group/item flex cursor-default select-none items-center gap-2.5 rounded-lg px-2 py-2 text-[14px] text-black/70 outline-none transition-colors data-[selected=true]:bg-black/[0.04] data-[selected=true]:text-black/90 dark:text-white/60 dark:data-[selected=true]:bg-white/[0.06] dark:data-[selected=true]:text-white/85"
    >
      {children}
    </Command.Item>
  );
}

function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  if (!query)
    return <span className="text-black/40 dark:text-white/30">{text}</span>;
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, "gi"));
  return (
    <span className="text-black/40 dark:text-white/30">
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span
            key={i}
            className="text-black/80 dark:text-white/80 font-medium bg-amber-200/40 dark:bg-amber-500/20 rounded-sm px-px"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTitle(content: any): string {
  if (!content) return "";
  if (content.type === "text") return content.text;
  if (content.content) {
    for (const child of content.content) {
      const text = extractTitle(child);
      if (text) return text;
    }
  }
  return "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFullText(content: any): string {
  if (!content) return "";
  let text = "";
  if (content.type === "text") {
    text += content.text;
  }
  if (content.content) {
    for (const child of content.content) {
      text += extractFullText(child) + " ";
    }
  }
  return text.trim();
}
