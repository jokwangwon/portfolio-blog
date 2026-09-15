import { readSnapshot } from "@/src/modules/pixel-office/presence/readSnapshot";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await readSnapshot(), { headers: { "Cache-Control": "no-store" } });
}
