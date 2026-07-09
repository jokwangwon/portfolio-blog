"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

interface SlashCommand {
  label: string;
  description: string;
  icon: string;
  group: string;
  action: (editor: Editor | null) => void;
}

const COMMANDS: SlashCommand[] = [
  // 기본 블록
  { label: "제목 1", description: "큰 제목", icon: "H1", group: "기본", action: (e) => e?.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: "제목 2", description: "중간 제목", icon: "H2", group: "기본", action: (e) => e?.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "제목 3", description: "작은 제목", icon: "H3", group: "기본", action: (e) => e?.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "글머리 기호", description: "순서 없는 목록", icon: "•", group: "기본", action: (e) => e?.chain().focus().toggleBulletList().run() },
  { label: "번호 목록", description: "순서 있는 목록", icon: "1.", group: "기본", action: (e) => e?.chain().focus().toggleOrderedList().run() },
  { label: "체크리스트", description: "할 일 목록", icon: "☑", group: "기본", action: (e) => e?.chain().focus().toggleTaskList().run() },
  { label: "코드 블록", description: "코드 작성", icon: "<>", group: "기본", action: (e) => e?.chain().focus().toggleCodeBlock().run() },
  { label: "인용", description: "인용문", icon: "|", group: "기본", action: (e) => e?.chain().focus().toggleBlockquote().run() },
  { label: "구분선", description: "가로선", icon: "—", group: "기본", action: (e) => e?.chain().focus().setHorizontalRule().run() },

  // 고급 블록
  { label: "토글", description: "접고 펼칠 수 있는 블록", icon: "▶", group: "고급", action: (e) => e?.chain().focus().setDetails().run() },
  { label: "표", description: "행/열 추가 가능한 표", icon: "▦", group: "고급", action: (e) => { setTimeout(() => e?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), 0); } },
  { label: "콜아웃", description: "강조 정보 블록", icon: "💡", group: "고급", action: (e) => e?.chain().focus().setCallout({ type: "info" }).run() },
  { label: "경고", description: "경고 콜아웃", icon: "⚠️", group: "고급", action: (e) => e?.chain().focus().setCallout({ type: "warning" }).run() },
  { label: "성공", description: "성공 콜아웃", icon: "✅", group: "고급", action: (e) => e?.chain().focus().setCallout({ type: "success" }).run() },
  { label: "에러", description: "에러 콜아웃", icon: "🚫", group: "고급", action: (e) => e?.chain().focus().setCallout({ type: "error" }).run() },

  // 미디어 & 임베드
  { label: "이미지", description: "이미지 URL 삽입", icon: "🖼", group: "미디어", action: (e) => {
    const url = prompt("이미지 URL을 입력하세요:");
    if (url) e?.chain().focus().setImage({ src: url }).run();
  }},
  { label: "임베드", description: "YouTube, Vimeo 등 URL 삽입", icon: "▷", group: "미디어", action: (e) => {
    const url = prompt("YouTube, Vimeo 등 URL을 입력하세요:");
    if (url) e?.chain().focus().setEmbed({ src: url }).run();
  }},
  { label: "수식", description: "LaTeX 수학 수식", icon: "∑", group: "미디어", action: (e) => e?.chain().focus().setMathBlock().run() },
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

  // Group filtered commands
  const grouped = useMemo(() => {
    const groups: { name: string; items: SlashCommand[] }[] = [];
    const seen = new Set<string>();
    for (const cmd of filtered) {
      if (!seen.has(cmd.group)) {
        seen.add(cmd.group);
        groups.push({ name: cmd.group, items: [] });
      }
      groups.find((g) => g.name === cmd.group)!.items.push(cmd);
    }
    return groups;
  }, [filtered]);

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
    const items = menu.querySelectorAll("[data-cmd-item]");
    const item = items[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Close on click outside
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [onClose]);

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

  let globalIdx = 0;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 max-h-72 rounded-lg border bg-popover shadow-md overflow-y-auto overscroll-contain"
      style={{ top: position.top, left: position.left }}
    >
      {grouped.map((group) => (
        <div key={group.name}>
          <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-popover">
            {group.name}
          </div>
          {group.items.map((cmd) => {
            const idx = globalIdx++;
            return (
              <button
                key={cmd.label}
                data-cmd-item
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
                  idx === selectedIndex ? "bg-accent" : ""
                }`}
                onMouseDown={(e) => { e.preventDefault(); onSelect(cmd.action); }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span className="w-7 h-7 rounded bg-muted flex items-center justify-center text-xs font-mono shrink-0">
                  {cmd.icon}
                </span>
                <div>
                  <div className="font-medium">{cmd.label}</div>
                  <div className="text-xs text-muted-foreground">{cmd.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
