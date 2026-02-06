"use client";

import { memo } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Palette } from "lucide-react";
import type { Note, NoteColor } from "@/lib/types";
import { NOTE_COLORS } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";
import { addTagToNote, removeTagFromNote } from "@/lib/api/tags";
import { TagSelector } from "@/components/tags/tag-selector";

// We receive data via 'data' prop from ReactFlow
interface NoteNodeData {
    note: Note;
    onUpdate: (id: string, updates: Partial<Note>) => void;
    onDelete: (id: string) => void;
    onBringToFront: (id: string) => void;
    remoteSelectors?: { id: string; name: string; color: string }[];
}

interface NoteNodeProps {
    data: NoteNodeData;
    selected: boolean;
}


function NoteNode({ data, selected }: NoteNodeProps) {
    const { note, onUpdate, onDelete, onBringToFront } = data;
    const router = useRouter();

    const colorClasses = NOTE_COLORS[note.color as NoteColor] || NOTE_COLORS.default;

    const handleContentChange = (content: JSONContent) => {
        onUpdate(note.id, { content });
    };

    const handleColorChange = (color: NoteColor) => {
        onUpdate(note.id, { color });
    };

    const handleTagToggle = async (tagId: string) => {
        const hasTag = note.tags?.some((t) => t.id === tagId);

        try {
            if (hasTag) {
                await removeTagFromNote(note.id, tagId);
            } else {
                await addTagToNote(note.id, tagId);
            }
            router.refresh();
        } catch (error) {
            console.error("Failed to toggle tag:", error);
        }
    };

    return (
        <>
            <NodeResizer
                minWidth={200}
                minHeight={100}
                isVisible={selected}
                handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
                onResizeEnd={(_e, params) => {
                    onUpdate(note.id, { width: params.width, height: params.height });
                }}
            />

            <div
                className={`group relative h-full w-full rounded-xl border shadow-sm transition-all ${colorClasses.bg
                    } ${colorClasses.border} ${selected ? "ring-2 ring-brand shadow-xl" : "hover:shadow-md"}`}
                style={{
                    // ReactFlow handles width/height via style prop on the wrapper, 
                    // but we want full height here
                }}
                onMouseDown={() => {
                    // Optional: Bring to front logic could be handled here or via ReactFlow selection
                    onBringToFront?.(note.id);
                }}
            >
                {/* Remote Selection Indicators */}
                {data.remoteSelectors?.map((selector, i) => (
                    <div
                        key={selector.id}
                        className="absolute inset-0 rounded-xl pointer-events-none ring-2 animate-in fade-in zoom-in duration-300"
                        style={{
                            boxShadow: `0 0 0 2px ${selector.color}`,
                            zIndex: 10 + i
                        }}

                    >
                        <div
                            className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap"
                            style={{ backgroundColor: selector.color }}
                        >
                            {selector.name}
                        </div>
                    </div>
                ))}

                {/* Header - Drag Handle Area */}
                {/* We add 'drag-handle' class to specific elements if we want to limit drag area, 
            or use dragHandle prop in ReactFlow node definition. 
            For now, let's allow dragging from header. */}
                <div className="group/header drag-handle flex items-center justify-between px-3 pt-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 left-0 right-0 z-10 cursor-grab active:cursor-grabbing">
                    <div className="flex items-center gap-1 nopan no-drag flex-1 justify-end"> {/* nopan/no-drag prevents conflict */}
                        <TagSelector
                            selectedTags={note.tags || []}
                            onTagToggle={handleTagToggle}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <div className="flex items-center gap-2">
                                        <Palette className="h-4 w-4" />
                                        <span>색상</span>
                                    </div>
                                </DropdownMenuItem>
                                <div className="flex gap-1 px-2 py-1">
                                    {(Object.keys(NOTE_COLORS) as NoteColor[]).map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => handleColorChange(color)}
                                            className={`w-5 h-5 rounded-full border-2 ${note.color === color
                                                ? "border-foreground"
                                                : "border-transparent"
                                                }`}
                                            style={{
                                                backgroundColor: color === "default" ? "white" : NOTE_COLORS[color].hex
                                            }}
                                        />
                                    ))}
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(note.id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    삭제
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Tags Display */}
                {note.tags && note.tags.length > 0 && (
                    <div className="px-3 pt-2 flex flex-wrap gap-1">
                        {note.tags.map((tag) => (
                            <span
                                key={tag.id}
                                className="px-2 py-0.5 text-xs font-medium rounded-full border bg-background/50 backdrop-blur-sm"
                                style={{ borderColor: tag.color, color: tag.color }}
                            >
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Content - nopan ensures we can select text without moving canvas */}
                <div className="px-4 pt-10 pb-4 h-full overflow-auto nowheel nopan cursor-text">
                    <TiptapEditor
                        content={note.content}
                        onChange={handleContentChange}
                        placeholder="노트를 작성하세요..."
                        className="min-h-full"
                    />
                </div>
            </div>

            {/* Connection Handles */}
            <Handle type="target" position={Position.Top} id="t-t" className="w-3 h-3 !bg-brand/30 hover:!bg-brand border-2 border-background" />
            <Handle type="source" position={Position.Top} id="s-t" className="w-3 h-3 !bg-brand/30 hover:!bg-brand border-2 border-background" />

            <Handle type="target" position={Position.Bottom} id="t-b" className="w-3 h-3 !bg-brand/30 hover:!bg-brand border-2 border-background" />
            <Handle type="source" position={Position.Bottom} id="s-b" className="w-3 h-3 !bg-brand/30 hover:!bg-brand border-2 border-background" />

            <Handle type="target" position={Position.Left} id="t-l" className="w-3 h-3 !bg-brand/30 hover:!bg-brand border-2 border-background" />
            <Handle type="source" position={Position.Left} id="s-l" className="w-3 h-3 !bg-brand/30 hover:!bg-brand border-2 border-background" />

            <Handle type="target" position={Position.Right} id="t-r" className="w-3 h-3 !bg-brand/30 hover:!bg-brand border-2 border-background" />
            <Handle type="source" position={Position.Right} id="s-r" className="w-3 h-3 !bg-brand/30 hover:!bg-brand border-2 border-background" />
        </>
    );
}

export default memo(NoteNode);
