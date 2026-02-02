"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Search, FileText, Plus, Sun, Moon, Laptop } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/types";

interface CommandMenuProps {
    notes?: Note[];
    onSelectNote?: (noteId: string) => void;
    onCreateNote?: () => void;
}

export function CommandMenu({ notes = [], onSelectNote, onCreateNote }: CommandMenuProps) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const router = useRouter();
    const { setTheme } = useTheme();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    // Filter notes based on query content
    const filteredNotes = React.useMemo(() => {
        if (!query.trim()) return [];

        return notes.map(note => {
            const fullText = extractFullText(note.content);
            const title = extractTitle(note.content) || "제목 없는 노트";
            const matchIndex = fullText.toLowerCase().indexOf(query.toLowerCase());

            if (matchIndex === -1) return null;

            // Create snippet around match
            const start = Math.max(0, matchIndex - 20);
            const end = Math.min(fullText.length, matchIndex + query.length + 60);
            let snippet = fullText.slice(start, end);

            if (start > 0) snippet = "..." + snippet;
            if (end < fullText.length) snippet = snippet + "...";

            return {
                ...note,
                title,
                snippet,
                matchIndexInSnippet: matchIndex - start + (start > 0 ? 3 : 0) // adjust for "..."
            };
        }).filter((note): note is (Note & { title: string; snippet: string; matchIndexInSnippet: number }) => note !== null);
    }, [notes, query]);

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            shouldFilter={false} // We implement custom filtering
            className="fixed top-[25vh] left-1/2 transform -translate-x-1/2 w-[640px] max-w-[90vw] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-[100] overflow-hidden p-0"
        >
            <DialogTitle className="sr-only">노트 검색</DialogTitle>
            <DialogDescription className="sr-only">노트의 제목이나 내용을 검색합니다.</DialogDescription>
            <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Command.Input
                    placeholder="검색어를 입력하세요..."
                    value={query}
                    onValueChange={setQuery}
                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0"
                />
            </div>

            <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
                {/* Removed Command.Empty intentionally */}

                {filteredNotes.length > 0 && (
                    <Command.Group heading="노트 검색 결과">
                        {filteredNotes.map((note) => (
                            <Command.Item
                                key={note.id}
                                onSelect={() => runCommand(() => onSelectNote?.(note.id))}
                                className="relative flex cursor-default select-none flex-col items-start rounded-md px-3 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[selected='true']:bg-zinc-100 dark:data-[selected='true']:bg-zinc-800 pointer-events-auto gap-1"
                            >
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <FileText className="h-3 w-3" />
                                    <span>{note.title}</span>
                                </div>
                                <div className="text-sm">
                                    {query ? (
                                        <HighlightedText text={note.snippet} query={query} />
                                    ) : (
                                        <span className="text-muted-foreground line-clamp-1">{note.snippet || "내용 없음"}</span>
                                    )}
                                </div>
                            </Command.Item>
                        ))}
                    </Command.Group>
                )}
            </Command.List>
        </Command.Dialog>
    );
}

function HighlightedText({ text, query }: { text: string, query: string }) {
    if (!query) return <span>{text}</span>;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <span key={i} className="font-bold text-foreground bg-yellow-100 dark:bg-yellow-900/30 px-0.5 rounded-sm">{part}</span>
                ) : (
                    <span key={i} className="text-muted-foreground">{part}</span>
                )
            )}
        </span>
    );
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
