import { open } from "node:fs/promises";
import { parseSnapshot, unavailableSnapshot } from "./presence";

export async function readSnapshot() {
  try {
    const file = await open(/* turbopackIgnore: true */ process.env.OFFICE_PRESENCE_FILE ?? "/office-presence/status.json", "r");
    try {
      if ((await file.stat()).size > 65536) return unavailableSnapshot();
      return parseSnapshot(JSON.parse(await file.readFile("utf8")));
    } finally { await file.close(); }
  } catch { return unavailableSnapshot(); }
}
