"use client";

import { useEffect, useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, Strikethrough, Code, Link } from "lucide-react";

interface BubbleToolbarProps {
  editor: Editor;
}

export default function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    const { from, to } = editor.state.selection;
    if (from === to) {
      setPos(null);
      return;
    }
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    const editorRect = editor.view.dom.getBoundingClientRect();

    setPos({
      top: start.top - editorRect.top - 44,
      left: (start.left + end.left) / 2 - editorRect.left - 80,
    });
  }, [editor]);

  useEffect(() => {
    editor.on("selectionUpdate", updatePosition);
    return () => {
      editor.off("selectionUpdate", updatePosition);
    };
  }, [editor, updatePosition]);

  if (!pos) return null;

  const buttons = [
    { icon: Bold, active: editor.isActive("bold"), action: () => editor.chain().focus().toggleBold().run() },
    { icon: Italic, active: editor.isActive("italic"), action: () => editor.chain().focus().toggleItalic().run() },
    { icon: Strikethrough, active: editor.isActive("strike"), action: () => editor.chain().focus().toggleStrike().run() },
    { icon: Code, active: editor.isActive("code"), action: () => editor.chain().focus().toggleCode().run() },
    { icon: Link, active: editor.isActive("link"), action: () => {
      if (editor.isActive("link")) {
        editor.chain().focus().unsetLink().run();
      } else {
        const url = prompt("URL을 입력하세요:");
        if (url) editor.chain().focus().setLink({ href: url }).run();
      }
    }},
  ];

  return (
    <div
      className="absolute z-50 flex items-center gap-0.5 rounded-lg border bg-popover shadow-md px-1 py-0.5"
      style={{ top: pos.top, left: pos.left }}
    >
      {buttons.map(({ icon: Icon, active, action }, i) => (
        <button
          key={i}
          onMouseDown={(e) => { e.preventDefault(); action(); }}
          className={`p-1.5 rounded hover:bg-accent transition-colors ${active ? "text-primary bg-accent" : "text-muted-foreground"}`}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
