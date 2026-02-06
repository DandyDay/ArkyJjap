"use client";

import { useMemo } from "react";
import type { RemoteUser } from "@/hooks/use-realtime-canvas";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CollaboratorsProps {
    users: Record<string, RemoteUser>;
    currentUser: User | null;
    currentUserColor: string;
}

export function Collaborators({ users, currentUser, currentUserColor }: CollaboratorsProps) {
    const activeUsers = useMemo(() => Object.values(users), [users]);

    return (
        <TooltipProvider>
            <div className="flex -space-x-2 overflow-hidden items-center">
                {/* Current User */}
                {currentUser && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="relative inline-block">
                                <Avatar className="h-8 w-8 border-2" style={{ borderColor: currentUserColor }}>
                                    <AvatarImage src={currentUser.user_metadata?.avatar_url} />
                                    <AvatarFallback className="text-[10px] font-bold">
                                        {currentUser.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{currentUser.email} (나)</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                {/* Remote Users */}
                {activeUsers.map((user) => (
                    user?.id ? (
                        <Tooltip key={user.id}>
                            <TooltipTrigger asChild>
                                <div className="relative inline-block">
                                    <Avatar className="h-8 w-8 border-2" style={{ borderColor: user.color || '#ccc' }}>
                                        <AvatarFallback className="text-[10px] font-bold" style={{ backgroundColor: `${user.color || '#ccc'}20`, color: user.color || '#ccc' }}>
                                            {(user.name || 'U').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{user.name || '알 수 없는 사용자'}</p>
                            </TooltipContent>
                        </Tooltip>
                    ) : null
                ))}

            </div>
        </TooltipProvider>
    );
}
