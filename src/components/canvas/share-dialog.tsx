"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, UserPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
}

interface CanvasMember {
    id: string;
    role: string;
    user_id: string;
    profiles: UserProfile;
}

interface ShareDialogProps {
    canvasId: string;
}

export function ShareDialog({ canvasId }: ShareDialogProps) {
    const [mounted, setMounted] = useState(false);
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [members, setMembers] = useState<CanvasMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [canvasId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 1) {
                searchUsers();
            } else {

                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const fetchMembers = async () => {
        try {
            const res = await fetch(`/api/canvases/${canvasId}/members`);
            const data = await res.json();
            if (data.members) {
                setMembers(data.members);
            }
        } catch (error) {
            console.error("Failed to fetch members:", error);
        }
    };

    const searchUsers = async () => {
        setIsSearching(true);
        try {
            const res = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.users) {
                setSearchResults(data.users);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const inviteUser = async (email: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/canvases/${canvasId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, role: "editor" }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("사용자를 초대했습니다.");
                setQuery("");
                setSearchResults([]);
                fetchMembers();
            } else {
                toast.error(data.error || "초대에 실패했습니다.");
            }
        } catch (error) {
            toast.error("오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const removeMember = async (userId: string) => {
        try {
            const res = await fetch(`/api/canvases/${canvasId}/members`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (res.ok) {
                toast.success("멤버를 삭제했습니다.");
                fetchMembers();
            }
        } catch (error) {
            toast.error("멤버 삭제 중 오류가 발생했습니다.");
        }
    };

    if (!mounted) {
        return (
            <Button variant="outline" size="sm" className="gap-2 h-8">
                <Share2 className="h-4 w-4" />
                공유
            </Button>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild >
                <Button variant="outline" size="sm" className="gap-2 h-8" >
                    <Share2 className="h-4 w-4" />
                    공유
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>캔버스 공유</DialogTitle>
                    <DialogDescription className="sr-only">
                        협업할 사용자를 이메일로 검색하거나 직접 초대할 수 있습니다.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="relative">
                        <div className="flex gap-2">
                            <Input
                                placeholder="이메일로 사용자 검색..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1"
                            />
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3" />}
                        </div>

                        {/* Search Results */}
                        {(searchResults.length > 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)) && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden">
                                {searchResults.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => inviteUser(user.email)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left border-b border-border/50"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatar_url || ""} />
                                            <AvatarFallback>{user.full_name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{user.full_name || "이름 없음"}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                ))}

                                {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query) && !searchResults.find(u => u.email === query) && (
                                    <button
                                        onClick={() => inviteUser(query)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left bg-brand/5 group"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                                            <UserPlus className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-brand truncate">"{query}" 초대하기</p>
                                            <p className="text-xs text-brand/70 truncate">이메일 주소로 직접 초대</p>
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}
                        {query.length >= 1 && !isSearching && searchResults.length === 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query) && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 p-3 text-sm text-muted-foreground text-center">
                                검색 결과가 없습니다.
                            </div>
                        )}

                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">멤버 목록</h4>
                        {members.length === 0 && !isLoading && (
                            <p className="text-xs text-muted-foreground text-center py-4">아직 공유된 멤버가 없습니다.</p>
                        )}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between gap-3 p-2 rounded-md border border-transparent hover:border-border transition-all">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.profiles?.avatar_url || ""} />
                                            <AvatarFallback>{member.profiles?.full_name?.charAt(0) || member.profiles?.email.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {member.profiles?.full_name || "이름 없음"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{member.profiles?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-bold text-muted-foreground tracking-wider">
                                            {member.role}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeMember(member.user_id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
