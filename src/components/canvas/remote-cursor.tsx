"use client";

import { useViewport } from "@xyflow/react";
import { RemoteUser } from "@/hooks/use-realtime-canvas";
import { MousePointer2 } from "lucide-react";


interface RemoteCursorProps {
    user: RemoteUser;
}

export function RemoteCursor({ user }: RemoteCursorProps) {
    const { x: vX, y: vY, zoom } = useViewport();

    if (!user.cursor) return null;

    // Convert flow coordinates back to screen-relative coordinates for the absolute container
    const screenX = user.cursor.x * zoom + vX;
    const screenY = user.cursor.y * zoom + vY;

    return (
        <div
            className="pointer-events-none absolute z-[9999] transition-transform duration-75 ease-out"
            style={{
                left: 0,
                top: 0,
                transform: `translate3d(${screenX}px, ${screenY}px, 0)`,
            }}
        >

            <MousePointer2
                className="h-5 w-5 fill-current"
                style={{ color: user.color || '#000' }}
            />
            <div
                className="ml-3 mt-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm whitespace-nowrap"
                style={{ backgroundColor: user.color || '#000' }}
            >
                {user.name || '알 수 없는 사용자'}
            </div>

        </div>
    );
}
