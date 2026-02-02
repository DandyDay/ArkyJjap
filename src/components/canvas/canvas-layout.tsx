"use client";

import { useState, useEffect } from "react";
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

interface CanvasLayoutProps {
    canvas: Canvas;
    notes: Note[];
    children: React.ReactNode;
}

export function CanvasLayout({ canvas, notes, children }: CanvasLayoutProps) {
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

            <div className="flex-1 overflow-hidden relative">
                <PanelGroup
                    id="canvas-layout-group"
                    orientation="horizontal"
                    className="h-full w-full"
                >
                    {/* Left Sidebar - 목차 */}
                    {showLeftSidebar && (
                        <>
                            <Panel
                                id="left-sidebar"
                                defaultSize="260px"
                                minSize="200px"
                                maxSize="400px"
                                className="bg-background border-r border-border"
                            >
                                <CanvasSidebar notes={notes} className="h-full" />
                            </Panel>
                            <PanelResizeHandle className="w-[3px] bg-transparent hover:bg-brand/30 active:bg-brand/50 transition-colors cursor-col-resize" />
                        </>
                    )}

                    {/* Main Content */}
                    <Panel id="main-content" className="relative overflow-hidden bg-muted/5">
                        {children}
                    </Panel>

                    {/* Right Sidebar - AI Chat */}
                    {showRightSidebar && (
                        <>
                            <PanelResizeHandle className="w-[3px] bg-transparent hover:bg-brand/30 active:bg-brand/50 transition-colors cursor-col-resize" />
                            <Panel
                                id="right-sidebar"
                                defaultSize="360px"
                                minSize="280px"
                                maxSize="500px"
                                className="bg-background border-l border-border"
                            >
                                <CanvasAiChat />
                            </Panel>
                        </>
                    )}
                </PanelGroup>
            </div>

            <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
        </div>
    );
}
