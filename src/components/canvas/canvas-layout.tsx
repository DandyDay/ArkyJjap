"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CanvasSidebar } from "./canvas-sidebar";
import { CanvasHeader } from "./canvas-header";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { useTheme } from "next-themes";
import type { Canvas, Note } from "@/lib/types";
import {
    Panel,
    Group as PanelGroup,
    Separator as PanelResizeHandle,
} from "react-resizable-panels";
import { CanvasAiChat } from "./canvas-ai-chat";
import { cn } from "@/lib/utils";

interface CanvasLayoutProps {
    canvas: Canvas;
    notes: Note[];
    children: React.ReactNode;
}

export function CanvasLayout({ canvas, notes, children }: CanvasLayoutProps) {
    const router = useRouter();
    const [showLeftSidebar, setShowLeftSidebar] = useState(true);
    const [showRightSidebar, setShowRightSidebar] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Global Keyboard Shortcuts
    useEffect(() => {
        if (!mounted) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "\\") {
                e.preventDefault();
                setShowLeftSidebar((prev) => !prev);
                return;
            }
            if (e.ctrlKey && e.key.toLowerCase() === "l") {
                e.preventDefault();
                setShowRightSidebar((prev) => !prev);
                return;
            }

            if (
                (e.target as HTMLElement).tagName === "INPUT" ||
                (e.target as HTMLElement).tagName === "TEXTAREA" ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            if (e.ctrlKey && e.key === ",") {
                e.preventDefault();
                setShowShortcuts((prev) => !prev);
                return;
            }

            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "t") {
                e.preventDefault();
                setTheme(theme === 'dark' ? 'light' : 'dark');
                return;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [theme, setTheme, mounted]);

    // Callback handlers for AI actions
    const handleNoteCreated = (note: any) => {
        console.log('Note created by AI:', note);
        router.refresh();
    };

    const handleNoteUpdated = (note: any, changes: any) => {
        console.log('Note updated by AI:', note, changes);
        router.refresh();
    };

    const handleNoteDeleted = (noteId: string) => {
        console.log('Note deleted by AI:', noteId);
        router.refresh();
    };

    if (!mounted) {
        return (
            <div className="flex h-full flex-col overflow-hidden bg-background text-foreground">
                <CanvasHeader canvas={canvas} />
                <div className="flex-1 bg-muted/5">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background text-foreground">
            <CanvasHeader canvas={canvas} />

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar with Animation */}
                <div
                    className={cn(
                        "h-full bg-background border-r border-border transition-all duration-300 ease-in-out overflow-hidden",
                        showLeftSidebar ? "w-[260px] min-w-[200px] max-w-[400px]" : "w-0 min-w-0"
                    )}
                    style={{
                        opacity: showLeftSidebar ? 1 : 0,
                        transform: showLeftSidebar ? 'translateX(0)' : 'translateX(-20px)'
                    }}
                >
                    <CanvasSidebar notes={notes} className="h-full w-[260px]" />
                </div>

                {/* Main Content */}
                <div className="flex-1 relative overflow-hidden bg-muted/5">
                    {children}
                </div>

                {/* Right Sidebar with Animation */}
                <div
                    className={cn(
                        "h-full bg-background border-l border-border transition-all duration-300 ease-in-out overflow-hidden",
                        showRightSidebar ? "w-[360px] min-w-[280px] max-w-[500px]" : "w-0 min-w-0"
                    )}
                    style={{
                        opacity: showRightSidebar ? 1 : 0,
                        transform: showRightSidebar ? 'translateX(0)' : 'translateX(20px)'
                    }}
                >
                    <div className="h-full w-[360px]">
                        <CanvasAiChat
                            canvasId={canvas.id}
                            onNoteCreated={handleNoteCreated}
                            onNoteUpdated={handleNoteUpdated}
                            onNoteDeleted={handleNoteDeleted}
                        />
                    </div>
                </div>
            </div>

            <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
        </div>
    );
}
