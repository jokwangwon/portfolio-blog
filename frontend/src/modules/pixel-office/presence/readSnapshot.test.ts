// @vitest-environment node
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { it, expect, vi } from "vitest";
import { readSnapshot } from "./readSnapshot";

it("reads 24 maximum-length Unicode project/title pairs and rejects oversized files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "office-snapshot-"));
  const path = join(dir, "status.json");
  vi.stubEnv("OFFICE_PRESENCE_FILE", path);
  try {
    const now = Date.now();
    const input = {version:1, updatedAt:now, enabled:true, sessions:Array.from({length:24}, (_,i)=>({
      id:`12345678-1234-4234-8234-${String(i).padStart(12,"0")}`, source:"codex", activity:"working", startedAt:now,
      projectName:"𠀀".repeat(64), publicTitle:"𠀀".repeat(48),
    }))};
    // Python's default JSON encoder escapes Unicode, including both surrogate units.
    const encoded = JSON.stringify(input).replace(/[\u0080-\uffff]/g, char => "\\u" + char.charCodeAt(0).toString(16).padStart(4,"0"));
    expect(Buffer.byteLength(encoded)).toBeGreaterThan(16384);
    await writeFile(path, encoded);
    expect((await readSnapshot()).sessions).toHaveLength(24);
    await writeFile(path, " ".repeat(65537));
    expect((await readSnapshot()).connection).toBe("unavailable");
  } finally {
    vi.unstubAllEnvs();
    await rm(dir, {recursive:true, force:true});
  }
});
