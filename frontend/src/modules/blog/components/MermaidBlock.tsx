"use client";

import { useEffect, useRef, useState } from "react";

export default function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains("dark")
            ? "dark"
            : "default",
          securityLevel: "strict",
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: rendered } = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(rendered);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "다이어그램 렌더링 실패");
          setSvg("");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <pre className="text-sm text-destructive bg-muted p-4 rounded-lg overflow-auto">
        {error}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className="flex justify-center my-4 overflow-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
