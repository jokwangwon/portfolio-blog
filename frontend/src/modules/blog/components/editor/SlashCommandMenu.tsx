"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

interface SlashCommand {
  label: string;
  description: string;
  icon: string;
  action: (editor: Editor | null) => void;
}

const COMMANDS: SlashCommand[] = [
  { label: "제목 1", description: "큰 제목", icon: "H1", action: (e) => e?.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: "제목 2", description: "중간 제목", icon: "H2", action: (e) => e?.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "제목 3", description: "작은 제목", icon: "H3", action: (e) => e?.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "글머리 기호", description: "순서 없는 목록", icon: "•", action: (e) => e?.chain().focus().toggleBulletList().run() },
  { label: "번호 목록", description: "순서 있는 목록", icon: "1.", action: (e) => e?.chain().focus().toggleOrderedList().run() },
  { label: "체크리스트", description: "할 일 목록", icon: "☑", action: (e) => e?.chain().focus().toggleTaskList().run() },
  { label: "코드 블록", description: "코드 작성", icon: "<>", action: (e) => e?.chain().focus().toggleCodeBlock().run() },
  { label: "인용", description: "인용문", icon: "❝", action: (e) => e?.chain().focus().toggleBlockquote().run() },
  { label: "구분선", description: "가로선", icon: "—", action: (e) => e?.chain().focus().setHorizontalRule().run() },
  { label: "이미지", description: "이미지 URL 삽입", icon: "🖼", action: (e) => {
    const url = prompt("이미지 URL을 입력하세요:");
    if (url) e?.chain().focus().setImage({ src: url }).run();
  }},
];

interface SlashCommandMenuProps {
  position: { top: number; left: number };
  query: string;
  onSelect: (action: (editor: Editor | null) => void) => void;
  onClose: () => void;
}

export default function SlashCommandMenu({ position, query, onSelect, onClose }: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return COMMANDS.filter((cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q)
    );
  }, [query]);

  // selectedIndex resets to 0 whenever query changes via key-based state reset
  const [selectedState, setSelectedState] = useState({ query, index: 0 });
  const selectedIndex = selectedState.query === query ? selectedState.index : 0;
  const setSelectedIndex = useCallback(
    (updater: number | ((prev: number) => number)) => {
      setSelectedState((prev) => {
        const current = prev.query === query ? prev.index : 0;
        const next = typeof updater === "function" ? updater(current) : updater;
        return { query, index: next };
      });
    },
    [query]
  );

  // Auto-scroll selected item into view
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const item = menu.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].action);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [filtered, selectedIndex, setSelectedIndex, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-64 max-h-72 rounded-lg border bg-popover shadow-md overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {filtered.map((cmd, i) => (
        <button
          key={cmd.label}
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
            i === selectedIndex ? "bg-accent" : ""
          }`}
          onMouseDown={(e) => { e.preventDefault(); onSelect(cmd.action); }}
          onMouseEnter={() => setSelectedIndex(i)}
        >
          <span className="w-7 h-7 rounded bg-muted flex items-center justify-center text-xs font-mono shrink-0">
            {cmd.icon}
          </span>
          <div>
            <div className="font-medium">{cmd.label}</div>
            <div className="text-xs text-muted-foreground">{cmd.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
