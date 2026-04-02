"use client";

import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Link,
  Image,
  Minus,
  Table,
  GitBranch,
} from "lucide-react";

interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsert: (text: string) => void;
}

function getSelection(textarea: HTMLTextAreaElement) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  return { start, end, selected };
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  onInsert: (text: string) => void
) {
  const { start, end, selected } = getSelection(textarea);
  const val = textarea.value;
  const newText =
    val.substring(0, start) + before + selected + after + val.substring(end);
  onInsert(newText);

  // 커서 위치 복원
  requestAnimationFrame(() => {
    textarea.focus();
    const cursorPos = selected
      ? start + before.length + selected.length + after.length
      : start + before.length;
    textarea.setSelectionRange(cursorPos, cursorPos);
  });
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  text: string,
  onInsert: (text: string) => void
) {
  const { start, end } = getSelection(textarea);
  const val = textarea.value;
  const newText = val.substring(0, start) + text + val.substring(end);
  onInsert(newText);

  requestAnimationFrame(() => {
    textarea.focus();
    const cursorPos = start + text.length;
    textarea.setSelectionRange(cursorPos, cursorPos);
  });
}

const tools = [
  {
    icon: Bold,
    label: "굵게",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) =>
      wrapSelection(ta, "**", "**", ins),
  },
  {
    icon: Italic,
    label: "기울임",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) =>
      wrapSelection(ta, "_", "_", ins),
  },
  { type: "separator" as const },
  {
    icon: Heading2,
    label: "제목 2",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) =>
      insertAtCursor(ta, "\n## ", ins),
  },
  {
    icon: Heading3,
    label: "제목 3",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) =>
      insertAtCursor(ta, "\n### ", ins),
  },
  { type: "separator" as const },
  {
    icon: List,
    label: "목록",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) =>
      insertAtCursor(ta, "\n- ", ins),
  },
  {
    icon: ListOrdered,
    label: "번호 목록",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) =>
      insertAtCursor(ta, "\n1. ", ins),
  },
  {
    icon: Quote,
    label: "인용",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) =>
      insertAtCursor(ta, "\n> ", ins),
  },
  { type: "separator" as const },
  {
    icon: Code,
    label: "코드 블록",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) =>
      wrapSelection(ta, "\n```\n", "\n```\n", ins),
  },
  {
    icon: Link,
    label: "링크",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) => {
      const { selected } = getSelection(ta);
      wrapSelection(ta, "[", `](${selected ? "" : "url"})`, ins);
    },
  },
  {
    icon: Image,
    label: "이미지",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) =>
      insertAtCursor(ta, "\n![alt text](image-url)\n", ins),
  },
  { type: "separator" as const },
  {
    icon: Table,
    label: "테이블",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) =>
      insertAtCursor(
        ta,
        "\n| 제목 | 설명 |\n|------|------|\n| 내용 | 내용 |\n",
        ins
      ),
  },
  {
    icon: Minus,
    label: "구분선",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) =>
      insertAtCursor(ta, "\n---\n", ins),
  },
  {
    icon: GitBranch,
    label: "Mermaid 다이어그램",
    action: (ta: HTMLTextAreaElement, ins: (t: string) => void) =>
      insertAtCursor(
        ta,
        '\n```mermaid\ngraph TD\n    A[시작] --> B{조건}\n    B -->|Yes| C[결과 1]\n    B -->|No| D[결과 2]\n```\n',
        ins
      ),
  },
];

export default function EditorToolbar({
  textareaRef,
  onInsert,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap gap-0.5 p-1 border border-border rounded-lg bg-muted/30 mb-2">
      {tools.map((tool, i) => {
        if ("type" in tool && tool.type === "separator") {
          return (
            <div
              key={`sep-${i}`}
              className="w-px h-6 bg-border mx-1 self-center"
            />
          );
        }

        const Tool = tool as {
          icon: React.ComponentType<{ className?: string }>;
          label: string;
          action: (
            ta: HTMLTextAreaElement,
            ins: (t: string) => void
          ) => void;
        };
        const Icon = Tool.icon;

        return (
          <Button
            key={Tool.label}
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title={Tool.label}
            onClick={() => {
              if (textareaRef.current) {
                Tool.action(textareaRef.current, onInsert);
              }
            }}
          >
            <Icon className="size-3.5" />
          </Button>
        );
      })}
    </div>
  );
}
