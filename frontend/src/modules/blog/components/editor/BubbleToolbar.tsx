"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, Strikethrough, Code, Link, Paintbrush, Highlighter } from "lucide-react";

const TEXT_COLORS = [
  { label: "기본", value: "", swatch: "var(--foreground)" },
  { label: "빨강", value: "#ef4444", swatch: "#ef4444" },
  { label: "주황", value: "#f97316", swatch: "#f97316" },
  { label: "노랑", value: "#eab308", swatch: "#eab308" },
  { label: "초록", value: "#22c55e", swatch: "#22c55e" },
  { label: "파랑", value: "#3b82f6", swatch: "#3b82f6" },
  { label: "보라", value: "#8b5cf6", swatch: "#8b5cf6" },
  { label: "회색", value: "#6b7280", swatch: "#6b7280" },
];

const HIGHLIGHT_COLORS = [
  { label: "없음", value: "", swatch: "transparent" },
  { label: "빨강", value: "#fde8e8", swatch: "#fde8e8" },
  { label: "주황", value: "#fef3e2", swatch: "#fef3e2" },
  { label: "노랑", value: "#fef9c3", swatch: "#fef9c3" },
  { label: "초록", value: "#dcfce7", swatch: "#dcfce7" },
  { label: "파랑", value: "#dbeafe", swatch: "#dbeafe" },
  { label: "보라", value: "#ede9fe", swatch: "#ede9fe" },
  { label: "회색", value: "#f3f4f6", swatch: "#f3f4f6" },
];

interface BubbleToolbarProps {
  editor: Editor;
}

export default function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<"text" | "highlight" | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const { from, to } = editor.state.selection;
    if (from === to) {
      setPos(null);
      setShowColorPicker(null);
      return;
    }
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);

    setPos({
      top: start.top - 44,
      left: (start.left + end.left) / 2 - 100,
    });
  }, [editor]);

  useEffect(() => {
    editor.on("selectionUpdate", updatePosition);
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    return () => {
      editor.off("selectionUpdate", updatePosition);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [editor, updatePosition]);

  // Close color picker on click outside
  useEffect(() => {
    if (!showColorPicker) return;
    const onDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showColorPicker]);

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
      ref={pickerRef}
      className="fixed z-50 flex items-center gap-0.5 rounded-lg border bg-popover shadow-md px-1 py-0.5"
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

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Text color */}
      <div className="relative">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            setShowColorPicker(showColorPicker === "text" ? null : "text");
          }}
          className={`p-1.5 rounded hover:bg-accent transition-colors ${
            editor.isActive("textStyle") ? "text-primary bg-accent" : "text-muted-foreground"
          }`}
          title="글자 색상"
        >
          <Paintbrush className="size-4" />
        </button>
        {showColorPicker === "text" && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 p-1.5 rounded-lg border bg-popover shadow-md grid grid-cols-4 gap-1 w-36 z-50">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.label}
                title={c.label}
                className="size-7 rounded border hover:ring-2 ring-primary transition-all flex items-center justify-center"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (c.value) {
                    editor.chain().focus().setColor(c.value).run();
                  } else {
                    editor.chain().focus().unsetColor().run();
                  }
                  setShowColorPicker(null);
                }}
              >
                <span className="text-sm font-bold" style={{ color: c.swatch }}>A</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Highlight */}
      <div className="relative">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            setShowColorPicker(showColorPicker === "highlight" ? null : "highlight");
          }}
          className={`p-1.5 rounded hover:bg-accent transition-colors ${
            editor.isActive("highlight") ? "text-primary bg-accent" : "text-muted-foreground"
          }`}
          title="형광펜"
        >
          <Highlighter className="size-4" />
        </button>
        {showColorPicker === "highlight" && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 p-1.5 rounded-lg border bg-popover shadow-md grid grid-cols-4 gap-1 w-36 z-50">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.label}
                title={c.label}
                className="size-7 rounded border hover:ring-2 ring-primary transition-all"
                style={{ backgroundColor: c.swatch }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (c.value) {
                    editor.chain().focus().toggleHighlight({ color: c.value }).run();
                  } else {
                    editor.chain().focus().unsetHighlight().run();
                  }
                  setShowColorPicker(null);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
