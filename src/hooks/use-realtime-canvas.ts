"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, User } from "@supabase/supabase-js";

export interface RemoteUser {
    id: string;
    email: string;
    name: string;
    color: string;
    cursor?: { x: number; y: number };
    selection?: string[];
}

export interface RemoteTextCursorInfo {
    userId: string;
    noteId: string;
    from: number;
    to: number;
    name: string;
    color: string;
}

interface PresencePayload {
    email?: string;
    name?: string;
    color?: string;
    cursor?: { x: number; y: number };
    selection?: string[];
}

interface BroadcastPayload {
    userId: string;
    cursor?: { x: number; y: number };
    selection?: string[];
    nodeId?: string;
    position?: { x: number; y: number };
}

interface TextCursorPayload {
    userId: string;
    noteId: string;
    from: number;
    to: number;
}

export function useRealtimeCanvas(canvasId: string) {
    const supabase = createClient();
    const [users, setUsers] = useState<Record<string, RemoteUser>>({});
    const usersRef = useRef<Record<string, RemoteUser>>({});
    const [textCursors, setTextCursors] = useState<Record<string, RemoteTextCursorInfo>>({});
    const channelRef = useRef<RealtimeChannel | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const userColor = useRef(`hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`);

    useEffect(() => {
        const initUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        initUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase.channel(`canvas-${canvasId}`, {
            config: {
                presence: {
                    key: currentUser.id,
                },
            },
        });

        channelRef.current = channel;

        channel
            .on("presence", { event: "sync" }, () => {
                const newState = channel.presenceState();
                const processedUsers: Record<string, RemoteUser> = {};

                Object.keys(newState).forEach((key) => {
                    const presence = newState[key][0] as PresencePayload;
                    if (key !== currentUser.id) {
                        processedUsers[key] = {
                            id: key,
                            email: presence.email || "",
                            name: presence.name || presence.email?.split("@")[0] || "Unknown",
                            color: presence.color || "#ccc",
                            cursor: presence.cursor,
                            selection: presence.selection,
                        };
                    }
                });
                setUsers(processedUsers);
                usersRef.current = processedUsers;
            })
            .on("presence", { event: "join" }, () => {
                // join handled by sync
            })
            .on("presence", { event: "leave" }, () => {
                // leave handled by sync
            })
            .on("broadcast", { event: "cursor" }, ({ payload }: { payload: BroadcastPayload }) => {
                setUsers((prev) => {
                    const existing = prev[payload.userId];
                    if (!existing) return prev;
                    return {
                        ...prev,
                        [payload.userId]: { ...existing, cursor: payload.cursor },
                    };
                });
            })
            .on("broadcast", { event: "selection" }, ({ payload }: { payload: BroadcastPayload }) => {
                setUsers((prev) => {
                    const existing = prev[payload.userId];
                    if (!existing) return prev;
                    return {
                        ...prev,
                        [payload.userId]: { ...existing, selection: payload.selection },
                    };
                });
            })
            .on("broadcast", { event: "node-move" }, () => {
                // Handled in CanvasView
            })
            .on("broadcast", { event: "text-cursor" }, ({ payload }: { payload: TextCursorPayload }) => {
                setTextCursors((prev) => {
                    const currentUsers = usersRef.current;
                    const user = currentUsers[payload.userId];
                    if (!user) return prev;
                    return {
                        ...prev,
                        [payload.userId]: {
                            userId: payload.userId,
                            noteId: payload.noteId,
                            from: payload.from,
                            to: payload.to,
                            name: user.name,
                            color: user.color,
                        },
                    };
                });
            })
            .subscribe(async (status: string) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        id: currentUser.id,
                        email: currentUser.email,
                        name: currentUser.user_metadata?.full_name,
                        color: userColor.current,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasId, currentUser]);

    const updateCursor = useCallback((x: number, y: number) => {
        if (!channelRef.current || !currentUser) return;

        channelRef.current.send({
            type: "broadcast",
            event: "cursor",
            payload: {
                userId: currentUser.id,
                cursor: { x, y },
            },
        });
    }, [currentUser]);

    const updateSelection = useCallback((nodeIds: string[]) => {
        if (!channelRef.current || !currentUser) return;

        channelRef.current.send({
            type: "broadcast",
            event: "selection",
            payload: {
                userId: currentUser.id,
                selection: nodeIds,
            },
        });
    }, [currentUser]);

    const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
        if (!channelRef.current || !currentUser) return;

        channelRef.current.send({
            type: "broadcast",
            event: "node-move",
            payload: {
                userId: currentUser.id,
                nodeId,
                position: { x, y }
            }
        });
    }, [currentUser]);

    // 노트 콘텐츠 변경을 원격 사용자에게 브로드캐스트 (쓰로틀링 포함)
    const contentThrottleRef = useRef<Record<string, number>>({});
    const broadcastContent = useCallback((noteId: string, content: unknown) => {
        if (!channelRef.current || !currentUser) return;

        const now = Date.now();
        const lastSent = contentThrottleRef.current[noteId] || 0;
        if (now - lastSent < 80) return; // 80ms 쓰로틀
        contentThrottleRef.current[noteId] = now;

        channelRef.current.send({
            type: "broadcast",
            event: "content-update",
            payload: {
                userId: currentUser.id,
                noteId,
                content,
            }
        });
    }, [currentUser]);

    // 텍스트 커서 위치 브로드캐스트 (50ms 쓰로틀)
    const textCursorThrottleRef = useRef(0);
    const broadcastTextCursor = useCallback((noteId: string, from: number, to: number) => {
        if (!channelRef.current || !currentUser) return;

        const now = Date.now();
        if (now - textCursorThrottleRef.current < 50) return;
        textCursorThrottleRef.current = now;

        channelRef.current.send({
            type: "broadcast",
            event: "text-cursor",
            payload: {
                userId: currentUser.id,
                noteId,
                from,
                to,
            }
        });
    }, [currentUser]);

    return {
        users,
        textCursors,
        updateCursor,
        updateSelection,
        updateNodePosition,
        broadcastContent,
        broadcastTextCursor,
        channel: channelRef.current,
        currentUser,
        userColor: userColor.current
    };
}
