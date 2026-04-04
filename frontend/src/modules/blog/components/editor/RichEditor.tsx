"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Markdown } from "tiptap-markdown";
import { createLowlight, common } from "lowlight";
import { useEffect, useRef, useState, useCallback } from "react";
import SlashCommandMenu from "./SlashCommandMenu";
import BubbleToolbar from "./BubbleToolbar";
import BlockHandle from "./BlockHandle";
import TableMenu from "./TableMenu";
import { Details, DetailsSummary, DetailsContent } from "./extensions/toggle";
import { TableCellWithBg } from "./extensions/table-cell-bg";
import { Callout } from "./extensions/callout";
import { Embed } from "./extensions/embed";
import { MathBlock } from "./extensions/math";

const lowlight = createLowlight(common);

interface RichEditorProps {
  content: string;
  onChange: (md: string) => void;
}

export default function RichEditor({ content, onChange }: RichEditorProps) {
  const [slashPos, setSlashPos] = useState<{ top: number; left: number } | null>(null);
  const [slashQuery, setSlashQuery] = useState("");
  const [dropIndicatorTop, setDropIndicatorTop] = useState<number | null>(null);
  const slashDocPos = useRef<number | null>(null);
  const slashFromButton = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef(content);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: "내용을 입력하세요... ( / 로 명령어 사용)" }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ allowBase64: true }),
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCellWithBg,
      TableHeader,
      Details,
      DetailsSummary,
      DetailsContent,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Callout,
      Embed,
      MathBlock,
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
        // Slash command trigger
        if (event.key === "/") {
          setTimeout(() => {
            if (!editor) return;
            const { from } = editor.state.selection;
            const coords = editor.view.coordsAtPos(from);
            slashDocPos.current = from - 1;
            slashFromButton.current = false;
            setSlashPos({ top: coords.bottom + 4, left: coords.left });
            setSlashQuery("");
          }, 0);
          return false;
        }
        if (slashPos && event.key === "Escape") {
          slashDocPos.current = null;
          setSlashPos(null);
          return true;
        }

        // Tab / Shift+Tab — list indent/outdent
        if (event.key === "Tab" && editor) {
          const isList =
            editor.isActive("bulletList") ||
            editor.isActive("orderedList") ||
            editor.isActive("taskList");
          if (isList) {
            event.preventDefault();
            if (event.shiftKey) {
              editor.chain().focus().liftListItem("listItem").run() ||
                editor.chain().focus().liftListItem("taskItem").run();
            } else {
              editor.chain().focus().sinkListItem("listItem").run() ||
                editor.chain().focus().sinkListItem("taskItem").run();
            }
            return true;
          }
        }

        return false;
      },
      handleDrop: (view, event, _slice, moved) => {
        // Block reorder drop
        const blockPosData = event.dataTransfer?.getData("application/x-block-pos");
        if (blockPosData) {
          event.preventDefault();
          try {
            const fromPos = parseInt(blockPosData);
            const fromNode = view.state.doc.nodeAt(fromPos);
            if (!fromNode) return false;

            const dropInfo = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (!dropInfo) return false;

            const $drop = view.state.doc.resolve(dropInfo.pos);
            const depth = Math.min($drop.depth, 1) || 1;
            const blockStart = $drop.before(depth);
            const blockNode = view.state.doc.nodeAt(blockStart);
            const blockEnd = blockStart + (blockNode?.nodeSize ?? 0);

            // Before or after the block at drop point
            const startCoords = view.coordsAtPos(blockStart);
            const endCoords = view.coordsAtPos(blockEnd);
            const midY = (startCoords.top + endCoords.bottom) / 2;
            const insertPos = event.clientY > midY ? blockEnd : blockStart;

            // Skip no-op
            if (insertPos === fromPos || insertPos === fromPos + fromNode.nodeSize) return false;

            const tr = view.state.tr;
            const nodeContent = fromNode.copy(fromNode.content);
            tr.delete(fromPos, fromPos + fromNode.nodeSize);
            tr.insert(tr.mapping.map(insertPos), nodeContent);
            view.dispatch(tr.scrollIntoView());
            return true;
          } catch {
            return false;
          }
        }

        // Image drop
        if (moved || !event.dataTransfer?.files?.length) return false;
        const file = event.dataTransfer.files[0];
        if (!file?.type.startsWith("image/")) return false;

        event.preventDefault();
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== "string") return;
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (pos) {
            const node = view.state.schema.nodes.image.create({ src: reader.result });
            const tr = view.state.tr.insert(pos.pos, node);
            view.dispatch(tr);
          }
        };
        reader.readAsDataURL(file);
        return true;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;

            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result !== "string") return;
              const node = view.state.schema.nodes.image.create({ src: reader.result });
              const tr = view.state.tr.replaceSelectionWith(node);
              view.dispatch(tr);
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== lastContentRef.current) {
      lastContentRef.current = content;
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Track slash query
  useEffect(() => {
    if (!editor || !slashPos || slashDocPos.current == null) return;
    const handler = () => {
      const slashStart = slashDocPos.current;
      if (slashStart == null) return;
      const { from } = editor.state.selection;
      if (from <= slashStart) {
        slashDocPos.current = null;
        setSlashPos(null);
        return;
      }
      if (!slashFromButton.current) {
        const queryStart = slashStart + 1;
        const query = editor.state.doc.textBetween(queryStart, from);
        setSlashQuery(query);
      }
    };
    editor.on("selectionUpdate", handler);
    editor.on("update", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("update", handler);
    };
  }, [editor, slashPos]);

  // Close slash menu on editor scroll
  useEffect(() => {
    if (!slashPos) return;
    const scrollEl = editorScrollRef.current;
    if (!scrollEl) return;
    const onScroll = () => {
      slashDocPos.current = null;
      setSlashPos(null);
    };
    scrollEl.addEventListener("scroll", onScroll);
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, [slashPos]);

  const handleSlashCommand = useCallback((action: (e: typeof editor) => void) => {
    if (!editor) return;

    if (!slashFromButton.current) {
      const deleteFrom = slashDocPos.current;
      if (deleteFrom != null) {
        const { from } = editor.state.selection;
        const deleteTo = Math.max(from, deleteFrom + 1);
        editor.chain().focus().deleteRange({ from: deleteFrom, to: deleteTo }).run();
      }
    }

    action(editor);
    slashDocPos.current = null;
    slashFromButton.current = false;
    setSlashPos(null);
  }, [editor]);

  const handleAddBlock = useCallback((docPos: number) => {
    if (!editor) return;
    try {
      const $pos = editor.state.doc.resolve(docPos);
      const after = $pos.after(1);

      editor.chain()
        .insertContentAt(after, { type: "paragraph" })
        .setTextSelection(after + 1)
        .focus()
        .run();

      slashFromButton.current = true;

      setTimeout(() => {
        const { from } = editor.state.selection;
        const coords = editor.view.coordsAtPos(from);
        slashDocPos.current = from;
        setSlashPos({ top: coords.bottom + 4, left: coords.left });
        setSlashQuery("");
      }, 10);
    } catch {
      editor.chain().focus("end").run();
    }
  }, [editor]);

  // Clear drop indicator on any dragend (e.g. drop outside editor)
  useEffect(() => {
    const clear = () => setDropIndicatorTop(null);
    window.addEventListener("dragend", clear, true);
    return () => window.removeEventListener("dragend", clear, true);
  }, []);

  // Drag-over indicator for block reorder
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("application/x-block-pos")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!editor) return;
    try {
      const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
      if (!pos) return;
      const $pos = editor.state.doc.resolve(pos.pos);
      const depth = Math.min($pos.depth, 1) || 1;
      const boundary = $pos.before(depth);
      const coords = editor.view.coordsAtPos(boundary);
      const scrollEl = editorScrollRef.current;
      const scrollRect = scrollEl?.getBoundingClientRect();
      if (scrollRect && scrollEl) {
        setDropIndicatorTop(coords.top - scrollRect.top + scrollEl.scrollTop);
      }
    } catch {
      /* ignore */
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div ref={containerRef} className="relative">
      <BubbleToolbar editor={editor} />
      <TableMenu editor={editor} />
      <div
        ref={editorScrollRef}
        className="relative max-h-[60vh] overflow-y-auto overscroll-contain"
        onDragOver={handleDragOver}
        onDragLeave={() => setDropIndicatorTop(null)}
        onDrop={() => setDropIndicatorTop(null)}
        onDragEnd={() => setDropIndicatorTop(null)}
      >
        <BlockHandle
          editor={editor}
          scrollRef={editorScrollRef}
          onAddBlock={handleAddBlock}
        />
        {/* Drop indicator line */}
        {dropIndicatorTop !== null && (
          <div
            className="absolute left-12 right-4 h-0.5 bg-primary rounded-full pointer-events-none z-30"
            style={{ top: dropIndicatorTop }}
          />
        )}
        <div
          className="cursor-text"
          role="textbox"
          tabIndex={-1}
          onKeyDown={() => editor.commands.focus()}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              editor.chain().focus("end").run();
            }
          }}
        >
          <EditorContent
            editor={editor}
            className="rich-editor-content prose prose-sm max-w-none pl-12 pr-4 py-4 min-h-[400px] focus:outline-none"
          />
        </div>
      </div>
      {slashPos && (
        <SlashCommandMenu
          position={slashPos}
          query={slashQuery}
          onSelect={handleSlashCommand}
          onClose={() => { slashDocPos.current = null; setSlashPos(null); }}
        />
      )}
      <div className="px-4 py-2 text-xs text-muted-foreground border-t border-input flex gap-4 flex-wrap">
        <span><kbd className="px-1 rounded bg-muted">⌘B</kbd> 볼드</span>
        <span><kbd className="px-1 rounded bg-muted">⌘I</kbd> 이탤릭</span>
        <span><kbd className="px-1 rounded bg-muted">⌘E</kbd> 코드</span>
        <span><kbd className="px-1 rounded bg-muted">/</kbd> 명령어</span>
        <span><kbd className="px-1 rounded bg-muted">Tab</kbd> 들여쓰기</span>
        <span><kbd className="px-1 rounded bg-muted">Shift+Enter</kbd> 줄바꿈</span>
      </div>
    </div>
  );
}
