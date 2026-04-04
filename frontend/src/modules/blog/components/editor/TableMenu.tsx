"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Plus,
  Minus,
  Trash2,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Palette,
} from "lucide-react";

const CELL_COLORS = [
  { label: "기본", value: "", swatch: "transparent" },
  { label: "회색", value: "var(--muted)", swatch: "#e5e5e5" },
  { label: "빨강", value: "#fde8e8", swatch: "#fde8e8" },
  { label: "주황", value: "#fef3e2", swatch: "#fef3e2" },
  { label: "노랑", value: "#fef9c3", swatch: "#fef9c3" },
  { label: "초록", value: "#dcfce7", swatch: "#dcfce7" },
  { label: "파랑", value: "#dbeafe", swatch: "#dbeafe" },
  { label: "보라", value: "#ede9fe", swatch: "#ede9fe" },
];

interface TableMenuProps {
  editor: Editor;
}

export default function TableMenu({ editor }: TableMenuProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [showColors, setShowColors] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!editor.isActive("table")) {
      setPos(null);
      setShowColors(false);
      return;
    }

    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    setPos({ top: coords.top - 44, left: coords.left });
  }, [editor]);

  useEffect(() => {
    editor.on("selectionUpdate", updatePosition);
    editor.on("update", updatePosition);
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("update", updatePosition);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [editor, updatePosition]);

  // Close color picker on click outside
  useEffect(() => {
    if (!showColors) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowColors(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showColors]);

  const setCellBg = useCallback(
    (color: string) => {
      editor
        .chain()
        .focus()
        .setCellAttribute("backgroundColor", color)
        .run();
      setShowColors(false);
    },
    [editor],
  );

  if (!pos) return null;

  const btn =
    "p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30";

  return (
    <div
      ref={menuRef}
      className="fixed z-50 flex items-center gap-0.5 rounded-lg border bg-popover shadow-md px-1 py-0.5"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* Row controls */}
      <button
        title="위에 행 추가"
        className={btn}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().addRowBefore().run();
        }}
      >
        <ArrowUp className="size-3.5" />
      </button>
      <button
        title="아래에 행 추가"
        className={btn}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().addRowAfter().run();
        }}
      >
        <ArrowDown className="size-3.5" />
      </button>
      <button
        title="행 삭제"
        className={btn}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().deleteRow().run();
        }}
      >
        <Minus className="size-3.5" />
      </button>

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Column controls */}
      <button
        title="왼쪽에 열 추가"
        className={btn}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().addColumnBefore().run();
        }}
      >
        <ArrowLeft className="size-3.5" />
      </button>
      <button
        title="오른쪽에 열 추가"
        className={btn}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().addColumnAfter().run();
        }}
      >
        <ArrowRight className="size-3.5" />
      </button>
      <button
        title="열 삭제"
        className={btn}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().deleteColumn().run();
        }}
      >
        <Plus className="size-3.5 rotate-45" />
      </button>

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Cell color */}
      <div className="relative">
        <button
          title="셀 배경색"
          className={btn}
          onMouseDown={(e) => {
            e.preventDefault();
            setShowColors((v) => !v);
          }}
        >
          <Palette className="size-3.5" />
        </button>
        {showColors && (
          <div className="absolute top-full left-0 mt-1 p-1.5 rounded-lg border bg-popover shadow-md grid grid-cols-4 gap-1 w-36 z-50">
            {CELL_COLORS.map((c) => (
              <button
                key={c.label}
                title={c.label}
                className="size-7 rounded border hover:ring-2 ring-primary transition-all"
                style={{
                  backgroundColor: c.swatch,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setCellBg(c.value);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Delete table */}
      <button
        title="표 삭제"
        className={`${btn} hover:text-destructive`}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().deleteTable().run();
        }}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
