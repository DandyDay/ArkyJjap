"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Connection,
  type Edge,
  addEdge,
  useEdgesState,
  BackgroundVariant,
  Panel,
  useViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  MousePointer2,
  Hand,
  Type,
} from "lucide-react";
import type { Note } from "@/lib/types";
import { createNote, updateNote, deleteNote, bringNoteToFront, createEdge, deleteEdge } from "@/lib/api/canvases";
import { cn } from "@/lib/utils";
import { CommandMenu } from "./command-menu";
import NoteNode from "./note-node";
import { useRealtimeCanvas } from "@/hooks/use-realtime-canvas";
import type { RemoteTextCursor } from "@/components/editor/extensions/remote-cursors";
import { RemoteCursor } from "./remote-cursor";
import { Collaborators } from "./collaborators";
import { createClient } from "@/lib/supabase/client";

interface CanvasViewProps {
  canvasId: string;
  initialNotes: Note[];
  initialEdges?: Edge[];
}

type Tool = "select" | "hand" | "text";

const nodeTypes = {
  note: NoteNode,
};

function CanvasFlow({ canvasId, initialNotes, initialEdges = [] }: CanvasViewProps) {
  const initialFlowNodes: Node[] = initialNotes.map((note) => ({
    id: note.id,
    type: "note",
    position: { x: note.position_x, y: note.position_y },
    data: { note },
    style: { width: note.width, height: note.height },
    dragHandle: '.drag-handle',
    zIndex: note.z_index,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const { screenToFlowPosition, setCenter, zoomIn, zoomOut, getViewport } = useReactFlow();
  const { zoom } = useViewport();

  const { users, textCursors, updateCursor, updateSelection, updateNodePosition, broadcastContent, broadcastTextCursor, channel, currentUser, userColor } = useRealtimeCanvas(canvasId);

  // 로컬에서 편집 중인 노트 ID → 마지막 편집 시각
  const localEditTimesRef = useRef<Map<string, number>>(new Map());

  // Sync server changes (DB Subscription)
  useEffect(() => {
    if (!channel) return;

    channel.on("broadcast", { event: "node-move" }, ({ payload }) => {
      setNodes((nds) => nds.map((node) => {
        if (node.id === payload.nodeId) {
          return { ...node, position: payload.position };
        }
        return node;
      }));
    });

    // 원격 사용자의 콘텐츠 변경 수신 (postgres_changes보다 빠름)
    channel.on("broadcast", { event: "content-update" }, ({ payload }) => {
      const { noteId, content } = payload;
      setNodes((nds) => nds.map((node) => {
        if (node.id === noteId) {
          const currentNote = node.data.note as Note;
          return {
            ...node,
            data: { ...node.data, note: { ...currentNote, content } },
          };
        }
        return node;
      }));
    });

    const supabase = createClient();
    const dbChannel = supabase
      .channel(`canvas-db-${canvasId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `canvas_id=eq.${canvasId}`
      }, (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
        if (payload.eventType === 'INSERT') {
          const newNote = payload.new as unknown as Note;
          setNodes((nds) => {
            if (nds.find(n => n.id === newNote.id)) return nds;
            return [...nds, {
              id: newNote.id,
              type: 'note',
              position: { x: newNote.position_x, y: newNote.position_y },
              style: { width: newNote.width, height: newNote.height },
              data: { note: newNote },
              dragHandle: '.drag-handle',
              zIndex: newNote.z_index,
            }];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedNote = payload.new as unknown as Note;
          setNodes((nds) => nds.map((node) => {
            if (node.id === updatedNote.id) {
              // 로컬에서 최근 편집된 노트는 content 에코백 방지
              const lastLocalEdit = localEditTimesRef.current.get(updatedNote.id) || 0;
              const isLocallyEditing = Date.now() - lastLocalEdit < 1500;
              const currentNote = node.data.note as Note;

              return {
                ...node,
                position: { x: updatedNote.position_x, y: updatedNote.position_y },
                style: { ...node.style, width: updatedNote.width, height: updatedNote.height },
                data: {
                  ...node.data,
                  note: {
                    ...updatedNote,
                    // 로컬 편집 중이면 content는 현재 로컬 상태 유지
                    content: isLocallyEditing ? currentNote.content : updatedNote.content,
                  }
                },
                zIndex: updatedNote.z_index,
              };
            }
            return node;
          }));
        } else if (payload.eventType === 'DELETE') {
          const old = payload.old as { id?: string };
          if (old.id) {
            setNodes((nds) => nds.filter((n) => n.id !== old.id));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
    };
  }, [canvasId, setNodes, channel]);

  // 커서 브로드캐스트 쓰로틀링 (50ms 간격)
  const lastCursorBroadcastRef = useRef(0);
  const onMouseMove = useCallback((event: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastCursorBroadcastRef.current < 50) return;
    lastCursorBroadcastRef.current = now;

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    updateCursor(position.x, position.y);
  }, [screenToFlowPosition, updateCursor]);

  const onSelectionChange = useCallback((params: { nodes: Node[] }) => {
    updateSelection(params.nodes.map(n => n.id));
  }, [updateSelection]);

  const remoteSelectorsMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; color: string }[]> = {};
    Object.values(users).forEach(user => {
      if (user.selection) {
        user.selection.forEach(nodeId => {
          if (!map[nodeId]) map[nodeId] = [];
          map[nodeId].push({ id: user.id, name: user.name, color: user.color });
        });
      }
    });
    return map;
  }, [users]);

  // 노트별 원격 텍스트 커서 맵
  const remoteTextCursorsMap = useMemo(() => {
    const map: Record<string, RemoteTextCursor[]> = {};
    Object.values(textCursors).forEach(tc => {
      if (!map[tc.noteId]) map[tc.noteId] = [];
      map[tc.noteId].push({
        userId: tc.userId,
        name: tc.name,
        color: tc.color,
        from: tc.from,
        to: tc.to,
      });
    });
    return map;
  }, [textCursors]);

  const handleCursorChange = useCallback((noteId: string, from: number, to: number) => {
    broadcastTextCursor(noteId, from, to);
  }, [broadcastTextCursor]);

  const handleUpdateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    // content 변경 시 로컬 편집 시각 기록 + 원격 브로드캐스트
    if (updates.content) {
      localEditTimesRef.current.set(id, Date.now());
      broadcastContent(id, updates.content);
    }

    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        const currentNote = node.data.note as Note;
        const updatedNote = { ...currentNote, ...updates };
        const styleUpdate: React.CSSProperties = {};
        if (updates.width) styleUpdate.width = updates.width;
        if (updates.height) styleUpdate.height = updates.height;

        return {
          ...node,
          data: { ...node.data, note: updatedNote },
          style: { ...node.style, ...styleUpdate },
          ...(updates.z_index ? { zIndex: updates.z_index } : {})
        };
      }
      return node;
    }));

    try {
      await updateNote(id, updates);
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  }, [setNodes, broadcastContent]);

  const handleDeleteNote = useCallback(async (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    try {
      await deleteNote(id);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  }, [setNodes]);

  const handleBringToFront = useCallback(async (id: string) => {
    const newZIndex = Date.now();
    setNodes((nds) => nds.map(n => n.id === id ? { ...n, zIndex: newZIndex } : n));
    try {
      await bringNoteToFront(id);
    } catch (e) {
      console.error(e);
    }
  }, [setNodes]);

  // Update nodes data with handlers
  useEffect(() => {
    setNodes((nds) => nds.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onUpdate: handleUpdateNote,
        onDelete: handleDeleteNote,
        onBringToFront: handleBringToFront,
        onCursorChange: handleCursorChange,
        remoteSelectors: remoteSelectorsMap[node.id] || [],
        remoteCursors: remoteTextCursorsMap[node.id] || [],
      },
    })));
  }, [handleUpdateNote, handleDeleteNote, handleBringToFront, handleCursorChange, setNodes, remoteSelectorsMap, remoteTextCursorsMap]);

  // Sync initialNotes changes from server
  useEffect(() => {
    setNodes((nds) => {
      return initialFlowNodes.map(initialNode => {
        const existingNode = nds.find(n => n.id === initialNode.id);
        if (existingNode) {
          return {
            ...existingNode,
            data: { ...existingNode.data, note: initialNode.data.note },
          };
        }
        return initialNode;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNotes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Create note at viewport center (uses getViewport from closure, not hook call)
  const addNoteAtCenter = useCallback(async () => {
    const { x, y, zoom: currentZoom } = getViewport();
    const centerX = (window.innerWidth / 2 - x) / currentZoom - 150;
    const centerY = (window.innerHeight / 2 - y) / currentZoom - 100;

    setActiveTool('select');

    try {
      const newNote = await createNote(canvasId, { x: centerX, y: centerY });
      const newNode: Node = {
        id: newNote.id,
        type: 'note',
        position: { x: newNote.position_x, y: newNote.position_y },
        style: { width: newNote.width, height: newNote.height },
        data: {
          note: newNote,
          onUpdate: handleUpdateNote,
          onDelete: handleDeleteNote,
          onBringToFront: handleBringToFront
        },
        dragHandle: '.drag-handle',
        zIndex: newNote.z_index,
      };
      setNodes((nds) => [...nds, newNode]);
    } catch (e) {
      console.error(e);
    }
  }, [canvasId, setNodes, handleUpdateNote, handleDeleteNote, handleBringToFront, getViewport]);

  const onPaneClick = useCallback(async (event: React.MouseEvent) => {
    if (activeTool === 'text') {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const centerX = position.x - 150;
      const centerY = position.y - 100;

      setActiveTool('select');
      try {
        const newNote = await createNote(canvasId, { x: centerX, y: centerY });
        const newNode: Node = {
          id: newNote.id,
          type: 'note',
          position: { x: newNote.position_x, y: newNote.position_y },
          style: { width: newNote.width, height: newNote.height },
          data: {
            note: newNote,
            onUpdate: handleUpdateNote,
            onDelete: handleDeleteNote,
            onBringToFront: handleBringToFront
          },
          dragHandle: '.drag-handle',
          zIndex: newNote.z_index,
        };
        setNodes((nds) => [...nds, newNode]);
      } catch (e) {
        console.error(e);
      }
    }
  }, [activeTool, canvasId, screenToFlowPosition, setNodes, handleUpdateNote, handleDeleteNote, handleBringToFront]);

  const handleSelectNoteFromMenu = useCallback((noteId: string) => {
    const node = nodes.find(n => n.id === noteId);
    if (node) {
      const width = node.width || 400;
      const height = node.height || 300;
      setCenter(node.position.x + width / 2, node.position.y + height / 2, { zoom: 1, duration: 800 });
    }
  }, [nodes, setCenter]);

  const onNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
    updateNodePosition(node.id, node.position.x, node.position.y);
  }, [updateNodePosition]);

  const onNodeDragStop = useCallback(async (_: React.MouseEvent, node: Node) => {
    await updateNote(node.id, {
      position_x: node.position.x,
      position_y: node.position.y
    });
  }, []);

  const onConnect = useCallback(async (params: Connection) => {
    if (!params.source || !params.target) return;

    const id = `e-${params.source}-${params.target}`;
    const newEdge: Edge = {
      id,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      type: 'smoothstep',
      animated: true,
    };
    setEdges((eds) => addEdge(newEdge, eds));

    try {
      await createEdge(canvasId, params.source, params.target, params.sourceHandle, params.targetHandle);
    } catch (e) {
      console.error("Failed to create edge:", e);
    }
  }, [canvasId, setEdges]);

  const onEdgesDelete = useCallback(async (edgesToDelete: Edge[]) => {
    for (const edge of edgesToDelete) {
      try {
        await deleteEdge(edge.id);
      } catch (e) {
        console.error("Failed to delete edge:", e);
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      switch (e.key.toLowerCase()) {
        case 'v': setActiveTool('select'); break;
        case 'h': setActiveTool('hand'); break;
        case 't': setActiveTool('text'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-full w-full bg-[#F9F9F9] relative" onMouseMove={onMouseMove}>
      <CommandMenu
        notes={nodes.map((n) => n.data.note as Note)}
        onSelectNote={handleSelectNoteFromMenu}
        onCreateNote={addNoteAtCenter}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={(deletedNodes) => deletedNodes.forEach(n => handleDeleteNote(n.id))}
        onEdgesDelete={onEdgesDelete}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        panOnScroll={activeTool === 'hand'}
        panOnDrag={activeTool === 'hand' || activeTool === 'select'}
        selectionOnDrag={activeTool === 'select'}
        minZoom={0.1}
        maxZoom={2}
        onPaneClick={onPaneClick}
        proOptions={{ hideAttribution: true }}
        className={activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : ''}
      >
        <Background color="#ddd" gap={20} size={1} variant={BackgroundVariant.Dots} />

        <Panel position="top-right" className="mt-4 mr-4">
          <Collaborators
            users={users}
            currentUser={currentUser}
            currentUserColor={userColor}
          />
        </Panel>

        <Panel position="bottom-center" className="mb-8">
          <div className="flex items-center gap-1 p-1.5 rounded-full bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-black/5">
            <ToolButton
              active={activeTool === 'select'}
              onClick={() => setActiveTool('select')}
              icon={<MousePointer2 className="h-4 w-4" />}
              label="선택 (V)"
            />
            <ToolButton
              active={activeTool === 'hand'}
              onClick={() => setActiveTool('hand')}
              icon={<Hand className="h-4 w-4" />}
              label="이동 (H)"
            />
            <div className="w-px h-4 bg-border mx-1" />
            <ToolButton
              active={activeTool === 'text'}
              onClick={() => { setActiveTool('text'); addNoteAtCenter(); }}
              icon={<Type className="h-4 w-4" />}
              label="텍스트 (T)"
            />
          </div>
        </Panel>

        <Panel position="bottom-right" className="mb-8 mr-4">
          <div className="flex items-center gap-1 rounded-full border bg-white shadow-sm p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => zoomOut()}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="w-10 text-center text-[10px] font-bold text-muted-foreground select-none">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => zoomIn()}>
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </Panel>
      </ReactFlow>

      {/* 원격 커서: ReactFlow 위에 렌더링되도록 DOM 순서상 뒤에 배치 */}
      {Object.values(users).map((user) => (
        user?.id ? <RemoteCursor key={user.id} user={user} /> : null
      ))}
    </div>
  );
}

function ToolButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label?: string }) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className={cn("h-9 w-9 rounded-full transition-all", active && "bg-black text-white hover:bg-black/90 hover:text-white")}
      onClick={onClick}
      title={label}
    >
      {icon}
    </Button>
  );
}

export function CanvasView(props: CanvasViewProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlow {...props} />
    </ReactFlowProvider>
  );
}
