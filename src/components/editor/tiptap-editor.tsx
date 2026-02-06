"use client";

import { useEditor, EditorContent, TiptapBubbleMenu as BubbleMenu, TiptapFloatingMenu as FloatingMenu, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import FloatingMenuExtension from '@tiptap/extension-floating-menu';
import { all, createLowlight } from "lowlight";
import SlashCommand from "./extensions/slash-command";
import suggestion from "./extensions/suggestion";
import { MathNode } from './extensions/math-node';
import "katex/dist/katex.min.css";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Sparkles, Loader2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import "./editor-styles.css";

// Create a lowlight instance with all languages
const lowlight = createLowlight(all);

interface TiptapEditorProps {
  content?: JSONContent;
  onChange?: (content: JSONContent) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  autofocus?: boolean;
}

// Define extensions outside or memoize them to prevent "Duplicate extension names" warnings
const getExtensions = (placeholder: string) => [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4, 5, 6],
    },
    codeBlock: false,
  }),
  BubbleMenuExtension,
  FloatingMenuExtension,
  CodeBlockLowlight.configure({
    lowlight,
  }),
  Placeholder.configure({
    placeholder,
    emptyEditorClass: "is-editor-empty",
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "text-brand underline cursor-pointer",
    },
  }),
  Image.configure({
    HTMLAttributes: {
      class: "rounded-lg max-w-full",
    },
  }),
  SlashCommand.configure({
    suggestion,
  }),
  MathNode,
];

export function TiptapEditor({
  content,
  onChange,
  placeholder = "내용을 입력하세요...",
  editable = true,
  className = "",
  autofocus = false,
}: TiptapEditorProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  // Tiptap의 BubbleMenu/FloatingMenu는 내부적으로 editor prop을 받지만,
  // 타입 정의가 불완전하므로 ComponentType으로 캐스팅
  const AnyBubbleMenu = BubbleMenu as React.ComponentType<Record<string, unknown>>;
  const AnyFloatingMenu = FloatingMenu as React.ComponentType<Record<string, unknown>>;

  const extensions = useMemo(() => getExtensions(placeholder), [placeholder]);

  const editor = useEditor({
    extensions,
    content,
    editable,
    autofocus,
    editorProps: {
      attributes: {
        class: `prose prose-base dark:prose-invert max-w-none focus:outline-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-4 prose-ol:pl-4 ${className}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    immediatelyRender: false,
  });

  const handleAIAction = async (type: string) => {
    if (!editor || isAiLoading) return;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");

    if (!text) {
      alert("AI 작업을 수행할 텍스트를 선택해주세요.");
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type }),
      });

      if (!res.ok) throw new Error("AI request failed");

      const data = await res.json();
      if (data.result) {
        editor.commands.insertContentAt({ from, to }, data.result);
      }
    } catch (error) {
      console.error(error);
      alert("AI 작업 중 오류가 발생했습니다.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // content가 변경되었을 때만 에디터를 업데이트 (포커스 중이면 무시)
  const contentRef = useRef(content);
  useEffect(() => {
    if (editor && content && !editor.isFocused && content !== contentRef.current) {
      contentRef.current = content;
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL을 입력하세요");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor relative group">
      {editor && editable && (
        <>
          <AnyBubbleMenu
            editor={editor}
            tippyOptions={{
              duration: 150,
              animation: 'shift-away',
              zIndex: 100,
            }}
            className="flex items-center gap-0.5 p-1 rounded-xl border bg-background/80 backdrop-blur-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 border-white/20 dark:border-white/10"
          >
            <div className="flex items-center gap-0.5 px-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-md transition-all ${isAiLoading
                      ? "bg-brand/10 text-brand cursor-wait"
                      : "hover:bg-brand/10 text-brand"
                      }`}
                    disabled={isAiLoading}
                  >
                    {isAiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>AI</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 p-1">
                  <DropdownMenuItem onClick={() => handleAIAction("improve")} className="gap-2 py-2">
                    <Sparkles className="h-4 w-4 text-brand" />
                    <span>문장 다듬기</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAIAction("fix_grammar")} className="gap-2 py-2">
                    <span className="text-base">📖</span>
                    <span>맞춤법 교정</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAIAction("summarize")} className="gap-2 py-2">
                    <span className="text-base">📝</span>
                    <span>요약하기</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="w-px h-4 bg-border/50 mx-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="px-2 py-1.5 text-xs font-medium rounded-md hover:bg-muted/50 flex items-center gap-1"
                  >
                    {editor.isActive("heading", { level: 1 }) ? "H1" :
                      editor.isActive("heading", { level: 2 }) ? "H2" :
                        editor.isActive("heading", { level: 3 }) ? "H3" : "본문"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[8rem] p-1">
                  <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="py-2 text-lg font-bold">
                    제목 1
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="py-2 text-md font-bold">
                    제목 2
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="py-2 font-bold">
                    제목 3
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()} className="py-2">
                    본문
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="w-px h-4 bg-border/50 mx-1" />

              <EditorButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
                title="기울임 (Ctrl+I)"
              >
                <span className="italic px-1 text-sm font-serif">I</span>
              </EditorButton>
              <EditorButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                active={editor.isActive("strike")}
                title="취소선"
              >
                <span className="line-through px-1 text-sm">S</span>
              </EditorButton>
              <EditorButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                active={editor.isActive("code")}
                title="코드"
              >
                <span className="px-1 text-sm font-mono opacity-80">{"<>"}</span>
              </EditorButton>

              <EditorButton
                onClick={() => editor.chain().focus().insertContent('$ ').run()}
                active={false}
                title="수식"
              >
                <span className="px-1 text-sm font-serif">Σ</span>
              </EditorButton>

              <div className="w-px h-4 bg-border/50 mx-1" />

              <EditorButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive("bulletList")}
                title="글머리 기호"
              >
                <span className="text-lg leading-none">•</span>
              </EditorButton>

              <EditorButton
                onClick={setLink}
                active={editor.isActive("link")}
                title="링크 (Ctrl+K)"
              >
                <span className="text-sm">🔗</span>
              </EditorButton>
            </div>
          </AnyBubbleMenu>

          <AnyFloatingMenu
            editor={editor}
            tippyOptions={{
              duration: 150,
              zIndex: 100,
            }}
            className="flex items-center gap-1 p-1.5 rounded-xl border bg-background/95 backdrop-blur-md shadow-xl z-50 animate-in fade-in slide-in-from-left-4 duration-300 border-border/50"
          >
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className="p-2 hover:bg-muted rounded text-xs font-bold"
              title="제목 1"
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className="p-2 hover:bg-muted rounded text-xs font-bold"
              title="제목 2"
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="p-2 hover:bg-muted rounded text-lg"
              title="글머리 기호"
            >
              •
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className="p-2 hover:bg-muted rounded text-brand"
              title="할 일 목록"
            >
              <Plus className="h-4 w-4" />
            </button>
          </AnyFloatingMenu>
        </>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function EditorButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-sm rounded transition-colors ${active
        ? "bg-brand text-white"
        : "hover:bg-muted text-muted-foreground"
        }`}
    >
      {children}
    </button>
  );
}
