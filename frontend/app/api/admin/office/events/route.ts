import { NextRequest, NextResponse } from "next/server";

// In-memory event buffer (dev server only — resets on restart)
const EVENT_BUFFER: HookEvent[] = [];
const MAX_BUFFER = 100;
const listeners = new Set<(event: HookEvent) => void>();

interface HookEvent {
  tool: string;
  file: string;
  result?: string;
  timestamp: string;
}

// POST: Receive hook events from Claude Code hooks or git hooks
export async function POST(request: NextRequest) {
  // Dev-only guard
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const event: HookEvent = await request.json();
    event.timestamp = event.timestamp || new Date().toISOString();

    EVENT_BUFFER.push(event);
    if (EVENT_BUFFER.length > MAX_BUFFER) EVENT_BUFFER.shift();

    // Notify all SSE listeners
    for (const listener of listeners) {
      listener(event);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}

// GET: SSE stream for real-time hook events
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send buffered events first
      for (const event of EVENT_BUFFER) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      // Listen for new events
      const onEvent = (event: HookEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          listeners.delete(onEvent);
        }
      };

      listeners.add(onEvent);

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          listeners.delete(onEvent);
        }
      }, 30000);

      // Cleanup on close — use the request signal if available
      // The stream will be closed when the client disconnects
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
