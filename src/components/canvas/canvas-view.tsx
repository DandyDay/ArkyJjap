"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type OnNodesChange,
  type NodeChange,
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
  Plus,
  ZoomIn,
  ZoomOut,
  MousePointer2,
  Hand,
  Type,
  ImageIcon,
  LayoutTemplate,
} from "lucide-react";
import type { Note } from "@/lib/types";
import { createNote, updateNote, deleteNote, bringNoteToFront, createEdge, deleteEdge } from "@/lib/api/canvases";
import { cn } from "@/lib/utils";
import { CommandMenu } from "./command-menu";
import NoteNode from "./note-node";

interface CanvasViewProps {
  canvasId: string;
  initialNotes: Note[];
  initialEdges?: Edge[];
}

type Tool = "select" | "hand" | "text" | "image";

const nodeTypes = {
  note: NoteNode,
};

function CanvasFlow({ canvasId, initialNotes, initialEdges = [] }: CanvasViewProps) {
  // Convert initialNotes to ReactFlow nodes
  const initialFlowNodes: Node[] = initialNotes.map((note) => ({
    id: note.id,
    type: "note",
    position: { x: note.position_x, y: note.position_y },
    data: {
      note,
      // We'll pass handlers later directly or via closure/updating nodes
    },
    // We set width/height in style or via <NodeResizer> updating style. 
    // ReactFlow usually handles dimensions in style for resizable nodes.
    style: { width: note.width, height: note.height },
    dragHandle: '.drag-handle', // Only drag from header
    zIndex: note.z_index,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const { screenToFlowPosition, setCenter, zoomIn, zoomOut, fitView, setViewport, getZoom } = useReactFlow();
  const { zoom } = useViewport();

  // Handlers for NoteNode
  const handleUpdateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    // Optimistic update
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        const currentNote = node.data.note as Note;
        const updatedNote = { ...currentNote, ...updates };

        // Update styles if size changed
        const styleUpdate: React.CSSProperties = {};
        if (updates.width) styleUpdate.width = updates.width;
        if (updates.height) styleUpdate.height = updates.height;

        return {
          ...node,
          data: { ...node.data, note: updatedNote },
          style: { ...node.style, ...styleUpdate }, // Important for visual resize
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
  }, [setNodes]);

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
    } catch (e) { console.error(e) }
  }, [setNodes]);

  // Update nodes data with handlers so the custom node component can use them
  useEffect(() => {
    setNodes((nds) => nds.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onUpdate: handleUpdateNote,
        onDelete: handleDeleteNote,
        onBringToFront: handleBringToFront,
      },
    })));
  }, [handleUpdateNote, handleDeleteNote, handleBringToFront, setNodes]);

  useEffect(() => {
    setNodes((nds) => {
      return initialFlowNodes.map(initialNode => {
        const existingNode = nds.find(n => n.id === initialNode.id);
        if (existingNode) {
          return {
            ...existingNode,
            data: {
              ...existingNode.data,
              note: initialNode.data.note,
            },
          };
        }
        return initialNode;
      });
    });
  }, [initialNotes, setNodes]);

  // Sync edges
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);


  // Handle node changes (drag, etc)
  const onNodesChangeWithPersist: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);

      // Persist changes to server
      changes.forEach(async (change) => {
        if (change.type === 'position' && change.dragging === false && change.position) {
          // Drag end
          const node = nodes.find(n => n.id === change.id);
          if (node) {
            await updateNote(change.id, {
              position_x: change.position.x, // Use the NEW position from change, or node.position? 
              // change.position is the delta or absolute? node change structure has 'position'
              // Actually for 'position' type, it has position: {x, y}
              position_y: change.position.y
            });
          }
        }
        if (change.type === 'dimensions' && change.resizing === false && change.dimensions) {
          // Resize end
          await updateNote(change.id, {
            width: change.dimensions.width,
            height: change.dimensions.height
          });
        }
      });
    },
    [onNodesChange, nodes]
  );

  // Custom hook to detect drag end for bulk updates if needed, 
  // but for now relying on change.dragging === false is standard in RF.
  // Note: ReactFlow 'position' change emits continuously. We should filter for 'dragging=false'. Since RF 11, we check change.dragging.

  // Create Node
  const addNoteAtCenter = useCallback(async () => {
    // Calculate center of viewport
    // Viewport center in flow coordinates:
    const { x, y, zoom } = useReactFlow().getViewport(); // Or use getViewport from closure if stable
    // Center of screen
    const centerX = (window.innerWidth / 2 - x) / zoom - 150;
    const centerY = (window.innerHeight / 2 - y) / zoom - 100;

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
  }, [canvasId, setNodes, handleUpdateNote, handleDeleteNote, handleBringToFront]);

  // Pane Click for creating note
  const onPaneClick = useCallback(async (event: React.MouseEvent) => {
    if (activeTool === 'text') {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const centerX = position.x - 150; // Center note on click
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

  // Command Menu Handler
  const handleSelectNoteFromMenu = useCallback((noteId: string) => {
    const node = nodes.find(n => n.id === noteId);
    if (node) {
      // Center view on node
      // We need width/height to center perfectly
      const width = node.width || 400; // fallback
      const height = node.height || 300;
      setCenter(node.position.x + width / 2, node.position.y + height / 2, { zoom: 1, duration: 800 });
    }
  }, [nodes, setCenter]);

  // Helper for actual server persist on drag stop is tricky in RF loop.
  // Best practice: onNodeDragStop
  const onNodeDragStop = useCallback(async (_: React.MouseEvent, node: Node) => {
    await updateNote(node.id, {
      position_x: node.position.x,
      position_y: node.position.y
    });
  }, []);

  const onConnect = useCallback(async (params: Connection) => {
    const id = `e-${params.source}-${params.target}`;
    const newEdge: Edge = {
      id,
      source: params.source!,
      target: params.target!,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      type: 'smoothstep',
      animated: true,
    };
    setEdges((eds) => addEdge(newEdge as any, eds));

    try {
      if (params.source && params.target) {
        await createEdge(canvasId, params.source, params.target, params.sourceHandle, params.targetHandle);
      }
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

  const onNodeResizeStop = useCallback(async (_: React.MouseEvent, params: any) => {
    // params contains { x, y, width, height }
    const { width, height } = params;
    // We need to find the ID, but resize event signature is (event, { node, ... }) in newer versions or similar.
    // Actually <NodeResizer> doesn't emit generic flow event easily except via onNodesChange. 
    // BUT, ReactFlow 'onNodeResizeEnd' prop exists?
    // Check docs: <ReactFlow onNodeResizeStop={...} />
    // Signature: (event, type, params) => void. params has { x, y, width, height, ... } and the node.
    // Wait, @xyflow/react might differ. 
    // Let's assume standard behavior: The 'onNodesChange' 'dimensions' event handles state. 
    // We need explicit persist.
  }, []);

  // Hacky persist for resize: use explicit callback on the node itself? 
  // Or just rely on onNodesChange with checking 'resizing' flag if available?
  // Let's use a simpler approach: NoteNode calls onUpdate when resize ends? 
  // NodeResizer has onResizeEnd! But that's inside the component.
  // We passed handles to data.

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).isContentEditable) return;
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
    <div className="h-full w-full bg-[#F9F9F9]">
      <CommandMenu
        // notes prop expects Note[], so we map ReactFlow nodes back to our Note type
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
        onNodesDelete={(nodes) => nodes.forEach(n => handleDeleteNote(n.id))}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStop={onNodeDragStop}
        // onNodeResizeStop is available in ReactFlow if using the hook/resizer correctly?
        // NoteNode uses <NodeResizer>. It modifies styles directly. 
        // We need to sync that style change to DB.
        // Let's update NoteNode to call onUpdate(id, { width, height }) onResizeEnd.

        panOnScroll={activeTool === 'hand' || !activeTool} // If hand tool using standard drag-pan
        panOnDrag={activeTool === 'hand' || activeTool === 'select'} // Select allows pan on background
        selectionOnDrag={activeTool === 'select'} // Standard selection box
        panOnScrollMode={undefined} // Default

        minZoom={0.1}
        maxZoom={2}

        onPaneClick={onPaneClick}
        proOptions={{ hideAttribution: true }}

        // Custom class for cursor
        className={activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : ''}
      >
        <Background color="#ddd" gap={20} size={1} variant={BackgroundVariant.Dots} />

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
  )
}

// Wrap in provider
export function CanvasView(props: CanvasViewProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlow {...props} />
    </ReactFlowProvider>
  )
}

// Handle resize persist in NoteNode component
// we need to modify NoteNode to accept onUpdate and call it onResizeEnd
