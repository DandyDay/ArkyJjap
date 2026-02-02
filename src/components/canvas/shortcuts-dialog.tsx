"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShortcutItem {
    label: string;
    keys: string[];
}

interface ShortcutSection {
    title: string;
    items: ShortcutItem[];
}

const SHORTCUTS: ShortcutSection[] = [
    {
        title: "글로벌",
        items: [
            { label: "단축키 가이드 열기", keys: ["Ctrl", ","] },
            { label: "커맨드 메뉴 열기", keys: ["Ctrl", "K"] },
            { label: "테마 전환", keys: ["Ctrl", "Shift", "T"] },
            { label: "왼쪽 사이드바 토글", keys: ["Ctrl", "\\"] },
            { label: "오른쪽 사이드바 토글", keys: ["Ctrl", "L"] },
        ],
    },
    {
        title: "캔버스 뷰",
        items: [
            { label: "선택 도구", keys: ["V"] },
            { label: "이동(핸드) 도구", keys: ["H"] },
            { label: "텍스트 도구", keys: ["T"] },
        ],
    },
    {
        title: "문서 뷰",
        items: [
            { label: "커맨드 메뉴 열기", keys: ["Ctrl", "K"] },
        ],
    },
];

interface ShortcutsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-8 gap-8">
                <DialogHeader className="sr-only">
                    <DialogTitle>단축키 가이드</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {SHORTCUTS.map((section) => (
                        <div key={section.title} className="space-y-6">
                            <h3 className="text-xl font-medium text-foreground">{section.title}</h3>
                            <div className="space-y-4">
                                {section.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{item.label}</span>
                                        <div className="flex items-center gap-1">
                                            {item.keys.map((key, k) => (
                                                <kbd
                                                    key={k}
                                                    className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-muted/50 px-1.5 font-mono text-xs font-medium text-muted-foreground shadow-sm border border-border"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
