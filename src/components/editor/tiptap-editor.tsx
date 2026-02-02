"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useCallback, useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TiptapEditorProps {
  content?: JSONContent;
  onChange?: (content: JSONContent) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  autofocus?: boolean;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "내용을 입력하세요...",
  editable = true,
  className = "",
  autofocus = false,
}: TiptapEditorProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
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
    ],
    content,
    editable,
    autofocus,
    editorProps: {
      attributes: {
        class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none ${className}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  // Sync content from outside
  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
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
    <div className="tiptap-editor">
      {editable && (
        <div className="flex flex-wrap gap-1 border-b border-border p-2 mb-2">
          <EditorButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="굵게"
          >
            <span className="font-bold">B</span>
          </EditorButton>
          <EditorButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="기울임"
          >
            <span className="italic">I</span>
          </EditorButton>
          <EditorButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="취소선"
          >
            <span className="line-through">S</span>
          </EditorButton>
          <div className="w-px bg-border mx-1" />
          <EditorButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="제목 1"
          >
            H1
          </EditorButton>
          <EditorButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="제목 2"
          >
            H2
          </EditorButton>
          <EditorButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="제목 3"
          >
            H3
          </EditorButton>
          <div className="w-px bg-border mx-1" />
          <EditorButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="글머리 기호"
          >
            •
          </EditorButton>
          <EditorButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="번호 목록"
          >
            1.
          </EditorButton>
          <EditorButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive("taskList")}
            title="체크리스트"
          >
            ☑
          </EditorButton>
          <div className="w-px bg-border mx-1" />
          <EditorButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="인용"
          >
            "
          </EditorButton>
          <EditorButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="코드 블록"
          >
            {"</>"}
          </EditorButton>
          <EditorButton
            onClick={setLink}
            active={editor.isActive("link")}
            title="링크"
          >
            🔗
          </EditorButton>
          <div className="w-px bg-border mx-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`px-2 py-1 text-sm rounded transition-colors flex items-center gap-1 ${isAiLoading
                    ? "bg-muted text-muted-foreground cursor-wait"
                    : "hover:bg-muted text-muted-foreground text-brand"
                  }`}
                disabled={isAiLoading}
              >
                {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="text-xs font-medium">AI</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleAIAction("improve")}>
                ✨ 문장 다듬기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAIAction("fix_grammar")}>
                📖 맞춤법 교정
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAIAction("summarize")}>
                📝 요약하기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAIAction("translate")}>
                🌐 번역하기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
