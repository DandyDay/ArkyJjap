"use client";

import { useChat } from "@ai-sdk/react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CanvasAiChat() {
    const { messages, status, sendMessage } = useChat();
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const content = input;
        setInput("");
        // sendMessage in v6 takes the message contents
        await sendMessage({
            parts: [{ type: 'text', text: content }]
        });
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-2 bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold">Arky AI Assistant</h3>
                    <p className="text-[10px] text-muted-foreground leading-none">Powered by Google Gemini</p>
                </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-brand/5 flex items-center justify-center text-brand/40">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">안녕하세요!</p>
                                <p className="text-xs text-muted-foreground max-w-[180px]">
                                    노트 작성이나 아이디어 구상에 도움이 필요하신가요? 무엇이든 물어보세요.
                                </p>
                            </div>
                        </div>
                    )}

                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${m.role === "user"
                                    ? "bg-brand text-white rounded-tr-none"
                                    : "bg-muted/50 border rounded-tl-none"
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1 opacity-70">
                                    {m.role === "user" ? (
                                        <>
                                            <span className="text-[10px] font-bold">YOU</span>
                                            <User className="w-3 h-3" />
                                        </>
                                    ) : (
                                        <>
                                            <Bot className="w-3 h-3" />
                                            <span className="text-[10px] font-bold">AI</span>
                                        </>
                                    )}
                                </div>
                                <div className="whitespace-pre-wrap leading-relaxed">
                                    {m.parts.map((part, i) => (
                                        part.type === 'text' ? <span key={i}>{part.text}</span> : null
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-muted/50 border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin text-brand" />
                                <span className="text-xs text-muted-foreground italic">생각 중...</span>
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
                        className="w-full bg-background border border-black/10 dark:border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all shadow-inner"
                        value={input}
                        placeholder="메시지를 입력하세요..."
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-1.5 h-8 w-8 rounded-lg p-0 bg-brand hover:bg-brand/90 text-white transition-transform active:scale-95 disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
                <div className="mt-2 text-center">
                    <p className="text-[9px] text-muted-foreground opacity-50">
                        Ctrl + L 로 채팅창을 닫을 수 있습니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
