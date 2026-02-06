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

export function useRealtimeCanvas(canvasId: string) {
    const supabase = createClient();
    const [users, setUsers] = useState<Record<string, RemoteUser>>({});
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

    return {
        users,
        updateCursor,
        updateSelection,
        updateNodePosition,
        channel: channelRef.current,
        currentUser,
        userColor: userColor.current
    };
}
