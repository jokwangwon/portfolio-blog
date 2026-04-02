"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";
import { createLowlight, common } from "lowlight";
import { useEffect, useRef, useState, useCallback } from "react";
import SlashCommandMenu from "./SlashCommandMenu";
import BubbleToolbar from "./BubbleToolbar";

const lowlight = createLowlight(common);

interface RichEditorProps {
  content: string;
  onChange: (md: string) => void;
}

export default function RichEditor({ content, onChange }: RichEditorProps) {
  const [slashPos, setSlashPos] = useState<{ top: number; left: number } | null>(null);
  const [slashQuery, setSlashQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: "내용을 입력하세요... ( / 로 명령어 사용)" }),
      CodeBlockLowlight.configure({ lowlight }),
      Image,
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown,
    ],
    content,
    onUpdate: ({ editor }) => {
      const md = (editor.storage as unknown as Record<string, { getMarkdown: () => string }>).markdown.getMarkdown();
      lastContentRef.current = md;
      onChange(md);
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (event.key === "/") {
          setTimeout(() => {
            if (!editor) return;
            const { from } = editor.state.selection;
            const coords = editor.view.coordsAtPos(from);
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (containerRect) {
              setSlashPos({
                top: coords.bottom - containerRect.top + 4,
                left: coords.left - containerRect.left,
              });
              setSlashQuery("");
            }
          }, 0);
          return false;
        }
        if (slashPos && event.key === "Escape") {
          setSlashPos(null);
          return true;
        }
        return false;
      },
    },
  });

  // Sync external content changes into editor
  useEffect(() => {
    if (editor && content !== lastContentRef.current) {
      lastContentRef.current = content;
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Track slash query
  useEffect(() => {
    if (!editor || !slashPos) return;
    const handler = () => {
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from);
      const slashIdx = textBefore.lastIndexOf("/");
      if (slashIdx === -1) {
        setSlashPos(null);
      } else {
        setSlashQuery(textBefore.slice(slashIdx + 1));
      }
    };
    editor.on("selectionUpdate", handler);
    editor.on("update", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("update", handler);
    };
  }, [editor, slashPos]);

  const handleSlashCommand = useCallback((action: (e: typeof editor) => void) => {
    if (!editor) return;
    // Remove the slash and query text
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from);
    const slashIdx = textBefore.lastIndexOf("/");
    if (slashIdx !== -1) {
      const deleteFrom = from - (textBefore.length - slashIdx);
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
    }
    action(editor);
    setSlashPos(null);
  }, [editor]);

  if (!editor) return null;

  return (
    <div ref={containerRef} className="relative">
      <BubbleToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="rich-editor-content prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none"
      />
      {slashPos && (
        <SlashCommandMenu
          position={slashPos}
          query={slashQuery}
          onSelect={handleSlashCommand}
          onClose={() => setSlashPos(null)}
        />
      )}
      <div className="px-4 py-2 text-xs text-muted-foreground border-t border-input flex gap-4">
        <span><kbd className="px-1 rounded bg-muted">⌘B</kbd> 볼드</span>
        <span><kbd className="px-1 rounded bg-muted">⌘I</kbd> 이탤릭</span>
        <span><kbd className="px-1 rounded bg-muted">⌘E</kbd> 코드</span>
        <span><kbd className="px-1 rounded bg-muted">/</kbd> 명령어</span>
      </div>
    </div>
  );
}
