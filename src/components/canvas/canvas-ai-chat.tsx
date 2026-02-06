"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
    Send,
    Bot,
    User,
    Loader2,
    Sparkles,
    Zap,
    MessageSquare,
    Plus,
    Pencil,
    Trash2,
    List,
    CheckCircle2,
    XCircle,
    ChevronDown,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CanvasAiChatProps {
    canvasId?: string;
    onNoteCreated?: (note: any) => void;
    onNoteUpdated?: (note: any, changes: any) => void;
    onNoteDeleted?: (noteId: string) => void;
}

interface ToolInvocation {
    toolName: string;
    toolCallId: string;
    state: 'partial-call' | 'call' | 'result';
    args?: any;
    result?: any;
}

const AI_MODELS = [
    // New requested models
    { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', provider: 'OpenAI', icon: '🌐' },
    { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', provider: 'Groq', icon: '🧠' },
    // OpenAI models
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', icon: '🤖' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: '🧠' },
    // Google models
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', icon: '✨' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', icon: '💎' },
] as const;

type ModelId = typeof AI_MODELS[number]['id'];

export function CanvasAiChat({
    canvasId,
    onNoteCreated,
    onNoteUpdated,
    onNoteDeleted
}: CanvasAiChatProps) {
    const [agentMode, setAgentMode] = useState(false);
    const [input, setInput] = useState("");
    const [selectedModel, setSelectedModel] = useState<ModelId>('openai/gpt-oss-120b');
    const [showModelSelector, setShowModelSelector] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const modelSelectorRef = useRef<HTMLDivElement>(null);
    const [isInjecting, setIsInjecting] = useState(false);

    const injectShellContext = useCallback(async () => {
        if (isInjecting) return;
        setIsInjecting(true);
        try {
            const response = await fetch('/api/shell-context');
            if (!response.ok) throw new Error('Failed to fetch context');
            const data = await response.json();
            if (data.success) {
                setInput(prev => {
                    const separator = prev ? '\n\n' : '';
                    return prev + separator + data.context;
                });
            }
        } catch (err) {
            console.error('Failed to fetch shell context:', err);
        } finally {
            setIsInjecting(false);
        }
    }, [isInjecting]);

    // Shortcut for shell context (Ctrl + P)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                injectShellContext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [injectShellContext]);

    // Close model selector when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
                setShowModelSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Create transport with dynamic body based on agentMode and model
    const transport = useMemo(() => new DefaultChatTransport({
        api: '/api/chat',
        body: {
            canvasId,
            agentMode,
            model: selectedModel,
        },
    }), [canvasId, agentMode, selectedModel]);

    const { messages, status, sendMessage, stop, error, clearError } = useChat({
        transport,
        onToolCall: async ({ toolCall }) => {
            console.log('Tool call:', toolCall);
        },
        onError: (err) => {
            console.error('Chat error:', err);
        },
    });

    const isLoading = status === "streaming" || status === "submitted";

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    // Handle tool results for callbacks
    useEffect(() => {
        messages.forEach((m) => {
            if (m.parts) {
                m.parts.forEach((part: any) => {
                    if (part.type === 'tool-invocation' && part.state === 'result') {
                        const result = part.result;
                        if (result?.success) {
                            if (result.action === 'create' && onNoteCreated) {
                                onNoteCreated(result.note);
                            } else if (result.action === 'update' && onNoteUpdated) {
                                onNoteUpdated(result.note, result.changes);
                            } else if (result.action === 'delete' && onNoteDeleted) {
                                onNoteDeleted(result.noteId);
                            }
                        }
                    }
                });
            }
        });
    }, [messages, onNoteCreated, onNoteUpdated, onNoteDeleted]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const content = input;
        setInput("");
        await sendMessage({ text: content });
    };

    const getToolIcon = (toolName: string) => {
        switch (toolName) {
            case 'createNote': return <Plus className="w-3 h-3" />;
            case 'updateNote': return <Pencil className="w-3 h-3" />;
            case 'deleteNote': return <Trash2 className="w-3 h-3" />;
            case 'listNotes': return <List className="w-3 h-3" />;
            default: return <Zap className="w-3 h-3" />;
        }
    };

    const getToolLabel = (toolName: string) => {
        switch (toolName) {
            case 'createNote': return '노트 생성';
            case 'updateNote': return '노트 수정';
            case 'deleteNote': return '노트 삭제';
            case 'listNotes': return '노트 목록';
            default: return toolName;
        }
    };

    const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

    const renderToolInvocation = (invocation: ToolInvocation) => {
        const isComplete = invocation.state === 'result';
        const isSuccess = isComplete && invocation.result?.success;
        const isError = isComplete && !invocation.result?.success;

        return (
            <div
                key={invocation.toolCallId}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all",
                    isComplete
                        ? isSuccess
                            ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                            : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
                        : "bg-brand/10 border-brand/30 text-brand animate-pulse"
                )}
            >
                {isComplete ? (
                    isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />
                ) : (
                    <Loader2 className="w-3 h-3 animate-spin" />
                )}
                {getToolIcon(invocation.toolName)}
                <span className="font-medium">{getToolLabel(invocation.toolName)}</span>
                {isComplete && invocation.result?.message && (
                    <span className="text-muted-foreground">- {invocation.result.message}</span>
                )}
            </div>
        );
    };

    const renderChangesVisualization = (changes: any) => {
        if (!changes || (!changes.before && !changes.after)) return null;

        return (
            <div className="mt-2 p-2 bg-muted/30 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-muted-foreground mb-1">변경 사항:</div>
                {changes.before?.title && (
                    <div className="flex gap-2">
                        <span className="text-red-500 line-through">{changes.before.title}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-green-500">{changes.after?.title}</span>
                    </div>
                )}
                {changes.before?.color && (
                    <div className="flex gap-2 items-center">
                        <span>색상:</span>
                        <span className={cn(
                            "px-2 py-0.5 rounded text-xs",
                            `bg-${changes.before.color === 'default' ? 'muted' : changes.before.color}-500/20`
                        )}>{changes.before.color}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className={cn(
                            "px-2 py-0.5 rounded text-xs",
                            `bg-${changes.after?.color === 'default' ? 'muted' : changes.after?.color}-500/20`
                        )}>{changes.after?.color}</span>
                    </div>
                )}
            </div>
        );
    };

    const renderMessageContent = (m: any) => {
        const toolInvocations: ToolInvocation[] = [];
        const textParts: string[] = [];

        m.parts?.forEach((part: any) => {
            if (part.type === 'text') {
                textParts.push(part.text);
            } else if (part.type === 'tool-invocation') {
                toolInvocations.push(part as ToolInvocation);
            }
        });

        return (
            <div className="space-y-2">
                {/* Tool invocations */}
                {toolInvocations.length > 0 && (
                    <div className="space-y-1">
                        {toolInvocations.map(renderToolInvocation)}
                        {toolInvocations.some(t => t.state === 'result' && t.result?.changes) && (
                            renderChangesVisualization(
                                toolInvocations.find(t => t.result?.changes)?.result?.changes
                            )
                        )}
                    </div>
                )}

                {/* Text content */}
                {textParts.length > 0 && (
                    <div className="whitespace-pre-wrap leading-relaxed">
                        {textParts.join('')}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        agentMode ? "bg-orange-500/20 text-orange-500" : "bg-brand/10 text-brand"
                    )}>
                        {agentMode ? <Zap className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">
                            {agentMode ? "Agent 모드" : "Arky AI"}
                        </h3>
                        <p className="text-[10px] text-muted-foreground leading-none">
                            {agentMode ? "캔버스 수정 가능" : "일반 대화"}
                        </p>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    <button
                        onClick={() => setAgentMode(false)}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                            !agentMode
                                ? "bg-background shadow text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <MessageSquare className="w-3 h-3" />
                        Chat
                    </button>
                    <button
                        onClick={() => setAgentMode(true)}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                            agentMode
                                ? "bg-orange-500 shadow text-white"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Zap className="w-3 h-3" />
                        Agent
                    </button>
                </div>
            </div>

            {/* Model Selector */}
            <div className="px-4 py-2 border-b bg-muted/10" ref={modelSelectorRef}>
                <div className="relative">
                    <button
                        onClick={() => setShowModelSelector(!showModelSelector)}
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs",
                            "bg-background border transition-all hover:border-brand/50",
                            showModelSelector && "border-brand ring-1 ring-brand/20"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-base">{currentModel.icon}</span>
                            <div className="text-left">
                                <div className="font-medium">{currentModel.name}</div>
                                <div className="text-[10px] text-muted-foreground">{currentModel.provider}</div>
                            </div>
                        </div>
                        <ChevronDown className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            showModelSelector && "rotate-180"
                        )} />
                    </button>

                    {/* Dropdown */}
                    {showModelSelector && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
                            {AI_MODELS.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        setSelectedModel(model.id);
                                        setShowModelSelector(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors",
                                        model.id === selectedModel && "bg-brand/10"
                                    )}
                                >
                                    <span className="text-base">{model.icon}</span>
                                    <div className="text-left flex-1">
                                        <div className="font-medium">{model.name}</div>
                                        <div className="text-[10px] text-muted-foreground">{model.provider}</div>
                                    </div>
                                    {model.id === selectedModel && (
                                        <CheckCircle2 className="w-3 h-3 text-brand" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Agent Mode Banner */}
            {agentMode && (
                <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20">
                    <p className="text-[11px] text-orange-600 dark:text-orange-400">
                        ⚡ Agent 모드: AI가 노트를 생성, 수정, 삭제할 수 있습니다.
                    </p>
                </div>
            )}

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl",
                                agentMode ? "bg-orange-500/10" : "bg-brand/5"
                            )}>
                                {currentModel.icon}
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">
                                    {agentMode ? "Agent 모드 활성화" : `${currentModel.name} 준비 완료`}
                                </p>
                                <p className="text-xs text-muted-foreground max-w-[200px]">
                                    {agentMode
                                        ? "\"새 노트 추가해줘\", \"첫 번째 노트 수정해줘\" 같은 명령을 내려보세요."
                                        : "노트 작성이나 아이디어 구상에 도움이 필요하신가요?"}
                                </p>
                            </div>

                            {/* Quick Actions for Agent Mode */}
                            {agentMode && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <button
                                        onClick={() => setInput("새 노트를 추가해줘")}
                                        className="px-3 py-1.5 bg-muted rounded-full text-xs hover:bg-muted/80 transition-colors"
                                    >
                                        + 새 노트 추가
                                    </button>
                                    <button
                                        onClick={() => setInput("현재 노트 목록 보여줘")}
                                        className="px-3 py-1.5 bg-muted rounded-full text-xs hover:bg-muted/80 transition-colors"
                                    >
                                        📋 노트 목록
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={cn(
                                    "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                                    m.role === "user"
                                        ? "bg-brand text-white rounded-tr-none"
                                        : "bg-muted/50 border rounded-tl-none"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1 opacity-70">
                                    {m.role === "user" ? (
                                        <>
                                            <span className="text-[10px] font-bold">YOU</span>
                                            <User className="w-3 h-3" />
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-base">{currentModel.icon}</span>
                                            <span className="text-[10px] font-bold">
                                                {agentMode ? "AGENT" : currentModel.name}
                                            </span>
                                        </>
                                    )}
                                </div>
                                {renderMessageContent(m)}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className={cn(
                                "border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2",
                                agentMode ? "bg-orange-500/5 border-orange-500/20" : "bg-muted/50"
                            )}>
                                <Loader2 className={cn(
                                    "w-3 h-3 animate-spin",
                                    agentMode ? "text-orange-500" : "text-brand"
                                )} />
                                <span className="text-xs text-muted-foreground italic">
                                    {agentMode ? "작업 수행 중..." : "생각 중..."}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="flex justify-start">
                            <div className="border border-red-500/30 bg-red-500/5 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm max-w-[90%]">
                                <div className="flex items-center gap-2 text-red-500 mb-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-xs font-bold">API 오류</span>
                                </div>
                                <div className="text-xs text-red-600 dark:text-red-400 space-y-2">
                                    {error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate') ? (
                                        <>
                                            <p className="font-medium">⚠️ API 할당량이 초과되었습니다</p>
                                            <p className="text-muted-foreground">
                                                {selectedModel.startsWith('gpt')
                                                    ? 'OpenAI API 크레딧이 부족하거나 요청 제한에 도달했습니다.'
                                                    : 'Google AI API 무료 할당량이 초과되었습니다.'}
                                            </p>
                                            <div className="mt-2 p-2 bg-muted/30 rounded text-[10px]">
                                                <p className="font-semibold mb-1">해결 방법:</p>
                                                <ul className="list-disc list-inside space-y-0.5">
                                                    <li>다른 AI 모델로 변경해보세요</li>
                                                    <li>잠시 후 다시 시도해보세요</li>
                                                    <li>API 대시보드에서 할당량을 확인하세요</li>
                                                </ul>
                                            </div>
                                        </>
                                    ) : (
                                        <p>{error.message || 'AI 응답 중 오류가 발생했습니다.'}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => clearError()}
                                    className="mt-3 flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>닫기</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-muted/10">
                <form
                    onSubmit={handleSubmit}
                    className="relative flex items-center"
                >
                    <input
                        className={cn(
                            "w-full bg-background border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 transition-all shadow-inner",
                            agentMode
                                ? "border-orange-500/30 focus:ring-orange-500/30"
                                : "border-black/10 dark:border-white/10 focus:ring-brand/30"
                        )}
                        value={input}
                        placeholder={agentMode ? "명령을 입력하세요..." : "메시지를 입력하세요..."}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className={cn(
                            "absolute right-1.5 h-8 w-8 rounded-lg p-0 text-white transition-transform active:scale-95 disabled:opacity-50",
                            agentMode ? "bg-orange-500 hover:bg-orange-600" : "bg-brand hover:bg-brand/90"
                        )}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
                <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground">
                    <p className="opacity-50 flex items-center gap-1">
                        Ctrl + L: 닫기 | Ctrl + P: 쉘 컨텍스트
                        {isInjecting && <Loader2 className="w-2 h-2 animate-spin ml-1 text-brand" />}
                    </p>
                    {isLoading && (
                        <button
                            onClick={() => stop()}
                            className="flex items-center gap-1 text-red-500 hover:text-red-600"
                        >
                            <XCircle className="w-3 h-3" />
                            중지
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
