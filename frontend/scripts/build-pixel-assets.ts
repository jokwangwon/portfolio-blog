/**
 * Build script for pixel-office asset index and furniture catalog.
 * Adapted from pixel-agents shared/assets/build.ts (MIT License).
 *
 * Reads furniture manifests and asset directories under
 * public/assets/pixel-office/ and produces:
 *   - asset-index.json (character, floor, wall file lists + default layout)
 *   - furniture-catalog.json (flat furniture catalog with metadata)
 *
 * Usage: npx tsx scripts/build-pixel-assets.ts
 */

import * as fs from "fs";
import * as path from "path";

// ── Types ──────────────────────────────────────────────────

interface ManifestAsset {
  type: "asset";
  id: string;
  file: string;
  width: number;
  height: number;
  footprintW: number;
  footprintH: number;
  orientation?: string;
  state?: string;
  frame?: number;
  mirrorSide?: boolean;
}

interface ManifestGroup {
  type: "group";
  groupType: "rotation" | "state" | "animation";
  rotationScheme?: string;
  orientation?: string;
  state?: string;
  members: ManifestNode[];
}

type ManifestNode = ManifestAsset | ManifestGroup;

interface FurnitureManifest {
  id: string;
  name: string;
  category: string;
  canPlaceOnWalls: boolean;
  canPlaceOnSurfaces: boolean;
  backgroundTiles: number;
  type: "asset" | "group";
  file?: string;
  width?: number;
  height?: number;
  footprintW?: number;
  footprintH?: number;
  groupType?: string;
  rotationScheme?: string;
  members?: ManifestNode[];
}

interface InheritedProps {
  groupId: string;
  name: string;
  category: string;
  canPlaceOnWalls: boolean;
  canPlaceOnSurfaces: boolean;
  backgroundTiles: number;
  orientation?: string;
  state?: string;
  rotationScheme?: string;
  animationGroup?: string;
}

interface CatalogEntry {
  id: string;
  name: string;
  label: string;
  category: string;
  file: string;
  furniturePath: string;
  width: number;
  height: number;
  footprintW: number;
  footprintH: number;
  isDesk: boolean;
  canPlaceOnWalls: boolean;
  canPlaceOnSurfaces?: boolean;
  backgroundTiles?: number;
  groupId?: string;
  orientation?: string;
  state?: string;
  mirrorSide?: boolean;
  rotationScheme?: string;
  animationGroup?: string;
  frame?: number;
}

interface FurnitureAsset {
  id: string;
  name: string;
  label: string;
  category: string;
  file: string;
  width: number;
  height: number;
  footprintW: number;
  footprintH: number;
  isDesk: boolean;
  canPlaceOnWalls: boolean;
  groupId?: string;
  canPlaceOnSurfaces?: boolean;
  backgroundTiles?: number;
  orientation?: string;
  state?: string;
  mirrorSide?: boolean;
  rotationScheme?: string;
  animationGroup?: string;
  frame?: number;
}

// ── Manifest flattening (from pixel-agents manifestUtils.ts) ──

function flattenManifest(
  node: ManifestNode,
  inherited: InheritedProps
): FurnitureAsset[] {
  if (node.type === "asset") {
    const asset = node as ManifestAsset;
    const orientation = asset.orientation ?? inherited.orientation;
    const state = asset.state ?? inherited.state;
    return [
      {
        id: asset.id,
        name: inherited.name,
        label: inherited.name,
        category: inherited.category,
        file: asset.file,
        width: asset.width,
        height: asset.height,
        footprintW: asset.footprintW,
        footprintH: asset.footprintH,
        isDesk: inherited.category === "desks",
        canPlaceOnWalls: inherited.canPlaceOnWalls,
        canPlaceOnSurfaces: inherited.canPlaceOnSurfaces,
        backgroundTiles: inherited.backgroundTiles,
        groupId: inherited.groupId,
        ...(orientation ? { orientation } : {}),
        ...(state ? { state } : {}),
        ...(asset.mirrorSide ? { mirrorSide: true } : {}),
        ...(inherited.rotationScheme ? { rotationScheme: inherited.rotationScheme } : {}),
        ...(inherited.animationGroup
          ? { animationGroup: inherited.animationGroup }
          : {}),
        ...(asset.frame !== undefined ? { frame: asset.frame } : {}),
      },
    ];
  }

  const group = node as ManifestGroup;
  const results: FurnitureAsset[] = [];

  for (const member of group.members) {
    const childProps: InheritedProps = { ...inherited };

    if (group.groupType === "rotation" && group.rotationScheme) {
      childProps.rotationScheme = group.rotationScheme;
    }

    if (group.groupType === "state") {
      if (group.orientation) childProps.orientation = group.orientation;
      if (group.state) childProps.state = group.state;
    }

    if (group.groupType === "animation") {
      const orient = group.orientation ?? inherited.orientation ?? "";
      const st = group.state ?? inherited.state ?? "";
      childProps.animationGroup =
        `${inherited.groupId}_${orient}_${st}`.toUpperCase();
      if (group.state) childProps.state = group.state;
    }

    if (group.orientation && !childProps.orientation) {
      childProps.orientation = group.orientation;
    }

    results.push(...flattenManifest(member, childProps));
  }

  return results;
}

// ── Build functions (from pixel-agents build.ts) ──

function buildFurnitureCatalog(assetsDir: string): CatalogEntry[] {
  const furnitureDir = path.join(assetsDir, "furniture");
  if (!fs.existsSync(furnitureDir)) return [];

  const catalog: CatalogEntry[] = [];
  const dirs = fs
    .readdirSync(furnitureDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const folderName of dirs) {
    const manifestPath = path.join(furnitureDir, folderName, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const manifest = JSON.parse(
        fs.readFileSync(manifestPath, "utf-8")
      ) as FurnitureManifest;

      if (manifest.type === "asset") {
        if (
          manifest.width == null ||
          manifest.height == null ||
          manifest.footprintW == null ||
          manifest.footprintH == null
        ) {
          continue;
        }
        const file = manifest.file ?? `${manifest.id}.png`;
        catalog.push({
          id: manifest.id,
          name: manifest.name,
          label: manifest.name,
          category: manifest.category,
          file,
          furniturePath: `furniture/${folderName}/${file}`,
          width: manifest.width,
          height: manifest.height,
          footprintW: manifest.footprintW,
          footprintH: manifest.footprintH,
          isDesk: manifest.category === "desks",
          canPlaceOnWalls: manifest.canPlaceOnWalls,
          canPlaceOnSurfaces: manifest.canPlaceOnSurfaces,
          backgroundTiles: manifest.backgroundTiles,
          groupId: manifest.id,
        });
      } else {
        if (!manifest.members) continue;
        const inherited: InheritedProps = {
          groupId: manifest.id,
          name: manifest.name,
          category: manifest.category,
          canPlaceOnWalls: manifest.canPlaceOnWalls,
          canPlaceOnSurfaces: manifest.canPlaceOnSurfaces,
          backgroundTiles: manifest.backgroundTiles,
          ...(manifest.rotationScheme
            ? { rotationScheme: manifest.rotationScheme }
            : {}),
        };
        const rootGroup: ManifestGroup = {
          type: "group",
          groupType: manifest.groupType as "rotation" | "state" | "animation",
          rotationScheme: manifest.rotationScheme,
          members: manifest.members,
        };
        const assets = flattenManifest(rootGroup, inherited);
        for (const asset of assets) {
          catalog.push({
            ...asset,
            furniturePath: `furniture/${folderName}/${asset.file}`,
          });
        }
      }
    } catch {
      // skip malformed manifests
    }
  }
  return catalog;
}

function buildAssetIndex(assetsDir: string) {
  function listSorted(subdir: string, pattern: RegExp): string[] {
    const dir = path.join(assetsDir, subdir);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => pattern.test(f))
      .sort((a, b) => {
        const na = parseInt(/(\d+)/.exec(a)?.[1] ?? "0", 10);
        const nb = parseInt(/(\d+)/.exec(b)?.[1] ?? "0", 10);
        return na - nb;
      });
  }

  let defaultLayout: string | null = null;
  let bestRev = 0;
  if (fs.existsSync(assetsDir)) {
    for (const f of fs.readdirSync(assetsDir)) {
      const m = /^default-layout-(\d+)\.json$/.exec(f);
      if (m) {
        const rev = parseInt(m[1], 10);
        if (rev > bestRev) {
          bestRev = rev;
          defaultLayout = f;
        }
      }
    }
    if (
      !defaultLayout &&
      fs.existsSync(path.join(assetsDir, "default-layout.json"))
    ) {
      defaultLayout = "default-layout.json";
    }
  }

  return {
    floors: listSorted("floors", /^floor_\d+\.png$/i),
    walls: listSorted("walls", /^wall_\d+\.png$/i),
    characters: listSorted("characters", /^char_\d+\.png$/i),
    defaultLayout,
  };
}

// ── Main ──

const assetsDir = path.resolve(__dirname, "../public/assets/pixel-office");

const index = buildAssetIndex(assetsDir);
const catalog = buildFurnitureCatalog(assetsDir);

fs.writeFileSync(
  path.join(assetsDir, "asset-index.json"),
  JSON.stringify(index, null, 2)
);
fs.writeFileSync(
  path.join(assetsDir, "furniture-catalog.json"),
  JSON.stringify(catalog, null, 2)
);

console.log(
  `[build-pixel-assets] Generated asset-index.json (${index.characters.length} chars, ${index.floors.length} floors, ${index.walls.length} walls)`
);
console.log(
  `[build-pixel-assets] Generated furniture-catalog.json (${catalog.length} entries)`
);
