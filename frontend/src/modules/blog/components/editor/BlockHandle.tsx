"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { GripVertical, Plus } from "lucide-react";

const TURN_INTO_OPTIONS = [
  { label: "텍스트", icon: "¶", action: (e: Editor) => e.chain().focus().setParagraph().run() },
  { label: "제목 1", icon: "H1", action: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: "제목 2", icon: "H2", action: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "제목 3", icon: "H3", action: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "글머리 기호", icon: "•", action: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { label: "번호 목록", icon: "1.", action: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { label: "체크리스트", icon: "☑", action: (e: Editor) => e.chain().focus().toggleTaskList().run() },
  { label: "인용", icon: "|", action: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { label: "코드 블록", icon: "<>", action: (e: Editor) => e.chain().focus().toggleCodeBlock().run() },
];

interface BlockHandleProps {
  editor: Editor;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onAddBlock: (docPos: number) => void;
}

export default function BlockHandle({ editor, scrollRef, onAddBlock }: BlockHandleProps) {
  const [block, setBlock] = useState<{ top: number; height: number; docPos: number } | null>(null);
  const [showTurnInto, setShowTurnInto] = useState(false);
  const hoveringHandle = useRef(false);
  const isDragging = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const menuRef = useRef<HTMLDivElement>(null);

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!hoveringHandle.current && !isDragging.current) {
        setBlock(null);
        setShowTurnInto(false);
      }
    }, 200);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      if (isDragging.current) return;
      const tiptap = el.querySelector(".tiptap");
      if (!tiptap) return;

      const scrollRect = el.getBoundingClientRect();
      for (const child of Array.from(tiptap.children) as HTMLElement[]) {
        const r = child.getBoundingClientRect();
        if (e.clientY >= r.top - 2 && e.clientY <= r.bottom + 2) {
          try {
            const pos = editor.view.posAtDOM(child, 0);
            clearTimeout(hideTimer.current);
            setBlock({
              top: r.top - scrollRect.top + el.scrollTop,
              height: r.height,
              docPos: pos,
            });
          } catch {
            /* ignore */
          }
          return;
        }
      }
      scheduleHide();
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", scheduleHide);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", scheduleHide);
      clearTimeout(hideTimer.current);
    };
  }, [editor, scrollRef, scheduleHide]);

  // Close turn-into menu on click outside
  useEffect(() => {
    if (!showTurnInto) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowTurnInto(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showTurnInto]);

  if (!block) return null;

  return (
    <div
      ref={menuRef}
      className="absolute left-1 z-40 flex items-center"
      style={{ top: block.top, height: block.height }}
      onMouseEnter={() => {
        hoveringHandle.current = true;
        clearTimeout(hideTimer.current);
      }}
      onMouseLeave={() => {
        hoveringHandle.current = false;
        scheduleHide();
      }}
    >
      <button
        type="button"
        className="size-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground/40 hover:text-foreground transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          onAddBlock(block.docPos);
        }}
        title="블록 추가"
      >
        <Plus className="size-3.5" />
      </button>
      <div className="relative">
        <button
          type="button"
          draggable
          className="w-5 h-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground/40 hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
          title="드래그하여 이동 · 클릭하여 변환"
          onClick={() => {
            // Select this block first, then show menu
            try {
              const $pos = editor.state.doc.resolve(block.docPos);
              const nodeStart = $pos.before(1);
              const node = editor.state.doc.nodeAt(nodeStart);
              if (node) {
                editor.chain().setTextSelection({ from: nodeStart + 1, to: nodeStart + 1 }).focus().run();
              }
            } catch { /* ignore */ }
            setShowTurnInto((v) => !v);
          }}
          onDragStart={(e) => {
            isDragging.current = true;
            setShowTurnInto(false);
            try {
              const $pos = editor.state.doc.resolve(block.docPos);
              const nodeStart = $pos.before(1);
              e.dataTransfer.setData("application/x-block-pos", String(nodeStart));
              e.dataTransfer.effectAllowed = "move";

              const nodeDom = editor.view.nodeDOM(nodeStart);
              if (nodeDom instanceof HTMLElement) {
                e.dataTransfer.setDragImage(nodeDom, 0, 0);
              }
            } catch {
              e.preventDefault();
            }
          }}
          onDragEnd={() => {
            isDragging.current = false;
          }}
        >
          <GripVertical className="size-3.5" />
        </button>

        {/* Turn-into menu */}
        {showTurnInto && (
          <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border bg-popover shadow-md overflow-hidden z-50">
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b">블록 변환</div>
            {TURN_INTO_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                onMouseDown={(e) => {
                  e.preventDefault();
                  opt.action(editor);
                  setShowTurnInto(false);
                }}
              >
                <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-mono shrink-0">
                  {opt.icon}
                </span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
