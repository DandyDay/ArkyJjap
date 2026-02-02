"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, FileText, Hash, Search } from "lucide-react";
import type { Note } from "@/lib/types";
import { useState } from "react";

interface CanvasSidebarProps {
    notes: Note[];
    className?: string;
}

export function CanvasSidebar({ notes, className }: CanvasSidebarProps) {
    return (
        <div
            className={cn(
                "flex h-full flex-col bg-sidebar text-sidebar-foreground",
                className
            )}
        >
            <div className="flex items-center p-4 border-b">
                <div className="flex gap-2 items-center bg-muted/50 rounded-md px-2 py-1.5 w-full">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                        className="bg-transparent border-none text-sm focus:outline-none w-full placeholder:text-muted-foreground"
                        placeholder="검색..."
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 py-2">
                <div className="px-2 space-y-1">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">
                        목차
                    </div>
                    {notes.map((note) => (
                        <Button
                            key={note.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 h-8 font-normal text-muted-foreground hover:text-foreground"
                        >
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate">{extractTitle(note.content) || "제목 없음"}</span>
                        </Button>
                    ))}

                    {notes.length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            노트가 없습니다
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

// Helper to extract text from Tiptap JSON content
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
