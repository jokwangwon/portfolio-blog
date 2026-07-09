"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import MermaidBlock from "./MermaidBlock";
import type { Components } from "react-markdown";

// rehype-sanitize 스키마: 기본 허용 + code 블록 class (highlight.js용)
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), "className"],
    span: [...(defaultSchema.attributes?.span || []), "className"],
  },
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const components: Components = {
    code({ className: codeClassName, children, ...props }) {
      const match = /language-(\w+)/.exec(codeClassName || "");
      const lang = match?.[1];
      const codeString = String(children).replace(/\n$/, "");

      // Mermaid 다이어그램
      if (lang === "mermaid") {
        return <MermaidBlock code={codeString} />;
      }

      // 인라인 코드
      if (!lang && !codeClassName) {
        return (
          <code
            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }

      // 코드 블록 (rehype-highlight가 처리)
      return (
        <code className={codeClassName} {...props}>
          {children}
        </code>
      );
    },
    pre({ children }) {
      return (
        <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
          {children}
        </pre>
      );
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="w-full border-collapse border border-border text-sm">
            {children}
          </table>
        </div>
      );
    },
    th({ children }) {
      return (
        <th className="border border-border bg-muted/50 px-4 py-2 text-left font-semibold">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="border border-border px-4 py-2">{children}</td>
      );
    },
    img({ src, alt }) {
      const srcStr = typeof src === "string" ? src : undefined;
      const safeSrc =
        srcStr && (srcStr.startsWith("http://") || srcStr.startsWith("https://") || srcStr.startsWith("/"))
          ? srcStr
          : undefined;
      return (
        <img
          src={safeSrc}
          alt={alt || ""}
          className="rounded-lg max-w-full h-auto my-4"
          loading="lazy"
        />
      );
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground my-4">
          {children}
        </blockquote>
      );
    },
    a({ href, children }) {
      const safeHref =
        href && (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("/") || href.startsWith("#"))
          ? href
          : undefined;
      return (
        <a
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className={`prose prose-neutral dark:prose-invert max-w-none ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeHighlight]}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  );
}
