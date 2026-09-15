import { readSnapshot } from "@/src/modules/pixel-office/presence/readSnapshot";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  let dispose = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let timer: ReturnType<typeof setTimeout>;
      const encoder = new TextEncoder();
      dispose = () => {
        if (closed) return;
        closed = true;
        clearTimeout(timer);
        request.signal.removeEventListener("abort", dispose);
        try { controller.close(); } catch { /* already cancelled */ }
      };
      request.signal.addEventListener("abort", dispose, { once: true });
      const tick = async () => {
        const snapshot = await readSnapshot();
        if (closed) return;
        if ((controller.desiredSize ?? 0) <= 0) { dispose(); return; }
        controller.enqueue(encoder.encode("event: presence\ndata: " + JSON.stringify(snapshot) + "\n\n"));
        timer = setTimeout(tick, 2000);
      };
      if (request.signal.aborted) dispose();
      else void tick();
    },
    cancel() { dispose(); },
  });
  return new Response(stream, { headers: {
    "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-store, no-transform",
    "X-Accel-Buffering": "no", Connection: "keep-alive",
  } });
}
