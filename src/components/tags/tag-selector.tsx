"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X, Tag as TagIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { createTag, getTags } from "@/lib/api/tags";
import type { Tag } from "@/lib/types";

interface TagSelectorProps {
    selectedTags: Tag[];
    onTagToggle: (tagId: string) => void;
    onTagCreate?: (tag: Tag) => void;
}

export function TagSelector({ selectedTags, onTagToggle, onTagCreate }: TagSelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Fetch all tags when opened
    useEffect(() => {
        if (open) {
            getTags().then(setAvailableTags).catch(console.error);
        }
    }, [open]);

    const filteredTags = availableTags.filter((tag) =>
        tag.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        setIsCreating(true);
        try {
            const newTag = await createTag(newTagName.trim());
            setAvailableTags((prev) => [...prev, newTag]);
            onTagToggle(newTag.id);
            onTagCreate?.(newTag);
            setNewTagName("");
            setSearch("");
        } catch (error) {
            console.error("Failed to create tag:", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild suppressHydrationWarning>
                <Button variant="outline" size="sm" className="h-8 border-dashed gap-1" suppressHydrationWarning>
                    <TagIcon className="h-3.5 w-3.5" />
                    {selectedTags.length > 0 ? (
                        <span className="flex gap-1">
                            {selectedTags.length}개의 태그
                        </span>
                    ) : (
                        "태그 추가"
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
                <div className="flex flex-col gap-3">
                    <div className="font-medium text-sm">태그 관리</div>
                    <Input
                        placeholder="태그 검색 또는 생성..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && search && filteredTags.length === 0) {
                                setNewTagName(search);
                                handleCreateTag();
                            }
                        }}
                    />

                    <div className="max-h-[200px] overflow-y-auto flex flex-col gap-1">
                        {filteredTags.map((tag) => {
                            const isSelected = selectedTags.some((t) => t.id === tag.id);
                            return (
                                <button
                                    key={tag.id}
                                    onClick={() => onTagToggle(tag.id)}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors ${isSelected
                                        ? "bg-brand/10 text-brand"
                                        : "hover:bg-muted text-foreground"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span>{tag.name}</span>
                                    </div>
                                    {isSelected && <X className="h-3 w-3" />}
                                </button>
                            );
                        })}

                        {search && filteredTags.length === 0 && (
                            <button
                                onClick={() => {
                                    setNewTagName(search);
                                    handleCreateTag();
                                }}
                                disabled={isCreating}
                                className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted text-muted-foreground"
                            >
                                <Plus className="h-3 w-3" />
                                <span>"{search}" 생성</span>
                            </button>
                        )}

                        {!search && filteredTags.length === 0 && (
                            <div className="text-xs text-center py-4 text-muted-foreground">
                                생성된 태그가 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
