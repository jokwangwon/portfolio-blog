// Pixel art sprite data system — all sprites are string[][] (hex color grids)
// '' = transparent pixel, '#RRGGBB' = opaque pixel

export type SpritePixel = string; // '' or '#RRGGBB'
export type SpriteData = SpritePixel[][];

// --- Character Sprites (8x16 per frame) ---
// Palette slots: H=hair, S=skin, T=shirt, P=pants, F=feet, E=eye, O=outline

interface CharPalette {
  H: string; S: string; T: string; P: string; F: string; E: string; O: string;
}

const PALETTES: Record<string, CharPalette> = {
  BACKEND:  { H: "#3A2518", S: "#F0C8A0", T: "#4A7FBF", P: "#2A2A4A", F: "#3A2A1A", E: "#1A1A2A", O: "#1A1020" },
  FRONTEND: { H: "#6B3A1A", S: "#F0C8A0", T: "#BF4A7F", P: "#2A2A4A", F: "#3A2A1A", E: "#1A1A2A", O: "#1A1020" },
  DEVOPS:   { H: "#2A3A3A", S: "#F0C8A0", T: "#4ABF5A", P: "#2A2A4A", F: "#3A2A1A", E: "#1A1A2A", O: "#1A1020" },
};

// Template: 8 wide x 16 tall character
type C = "" | "H" | "S" | "T" | "P" | "F" | "E" | "O";

const TPL_DOWN: C[][] = [
  ["", "", "O", "O", "O", "O", "", ""],
  ["", "O", "H", "H", "H", "H", "O", ""],
  ["", "H", "H", "H", "H", "H", "H", ""],
  ["", "H", "H", "H", "H", "H", "H", ""],
  ["O", "S", "E", "S", "S", "E", "S", "O"],
  ["", "S", "S", "S", "S", "S", "S", ""],
  ["", "", "O", "S", "S", "O", "", ""],
  ["", "O", "T", "T", "T", "T", "O", ""],
  ["", "T", "T", "T", "T", "T", "T", ""],
  ["O", "S", "T", "T", "T", "T", "S", "O"],
  ["", "", "T", "T", "T", "T", "", ""],
  ["", "", "O", "T", "T", "O", "", ""],
  ["", "", "P", "P", "P", "P", "", ""],
  ["", "", "P", "O", "O", "P", "", ""],
  ["", "", "P", "", "", "P", "", ""],
  ["", "", "F", "", "", "F", "", ""],
];

const TPL_UP: C[][] = [
  ["", "", "O", "O", "O", "O", "", ""],
  ["", "O", "H", "H", "H", "H", "O", ""],
  ["", "H", "H", "H", "H", "H", "H", ""],
  ["", "H", "H", "H", "H", "H", "H", ""],
  ["O", "H", "H", "H", "H", "H", "H", "O"],
  ["", "S", "S", "H", "H", "S", "S", ""],
  ["", "", "O", "S", "S", "O", "", ""],
  ["", "O", "T", "T", "T", "T", "O", ""],
  ["", "T", "T", "T", "T", "T", "T", ""],
  ["O", "S", "T", "T", "T", "T", "S", "O"],
  ["", "", "T", "T", "T", "T", "", ""],
  ["", "", "O", "T", "T", "O", "", ""],
  ["", "", "P", "P", "P", "P", "", ""],
  ["", "", "P", "O", "O", "P", "", ""],
  ["", "", "P", "", "", "P", "", ""],
  ["", "", "F", "", "", "F", "", ""],
];

const TPL_RIGHT: C[][] = [
  ["", "", "", "O", "O", "O", "", ""],
  ["", "", "O", "H", "H", "H", "O", ""],
  ["", "", "H", "H", "H", "H", "H", ""],
  ["", "", "H", "H", "H", "H", "H", ""],
  ["", "O", "S", "S", "E", "S", "O", ""],
  ["", "", "S", "S", "S", "S", "", ""],
  ["", "", "O", "S", "O", "", "", ""],
  ["", "O", "T", "T", "T", "O", "", ""],
  ["", "T", "T", "T", "T", "T", "", ""],
  ["", "S", "T", "T", "T", "O", "", ""],
  ["", "O", "T", "T", "T", "", "", ""],
  ["", "", "O", "T", "O", "", "", ""],
  ["", "", "P", "P", "P", "", "", ""],
  ["", "", "P", "O", "P", "", "", ""],
  ["", "", "P", "", "P", "", "", ""],
  ["", "", "F", "", "F", "", "", ""],
];

const TPL_WALK_DOWN: C[][] = [
  ["", "", "O", "O", "O", "O", "", ""],
  ["", "O", "H", "H", "H", "H", "O", ""],
  ["", "H", "H", "H", "H", "H", "H", ""],
  ["", "H", "H", "H", "H", "H", "H", ""],
  ["O", "S", "E", "S", "S", "E", "S", "O"],
  ["", "S", "S", "S", "S", "S", "S", ""],
  ["", "", "O", "S", "S", "O", "", ""],
  ["", "O", "T", "T", "T", "T", "O", ""],
  ["", "T", "T", "T", "T", "T", "T", ""],
  ["O", "S", "T", "T", "T", "T", "S", "O"],
  ["", "", "T", "T", "T", "T", "", ""],
  ["", "", "O", "T", "T", "O", "", ""],
  ["", "", "P", "P", "P", "P", "", ""],
  ["", "P", "O", "", "", "O", "P", ""],
  ["", "F", "", "", "", "", "F", ""],
  ["", "", "", "", "", "", "", ""],
];

const TPL_TYPING: C[][] = [
  ["", "", "O", "O", "O", "O", "", ""],
  ["", "O", "H", "H", "H", "H", "O", ""],
  ["", "H", "H", "H", "H", "H", "H", ""],
  ["", "H", "H", "H", "H", "H", "H", ""],
  ["O", "S", "E", "S", "S", "E", "S", "O"],
  ["", "S", "S", "S", "S", "S", "S", ""],
  ["", "", "O", "S", "S", "O", "", ""],
  ["", "O", "T", "T", "T", "T", "O", ""],
  ["", "T", "T", "T", "T", "T", "T", ""],
  ["", "T", "T", "T", "T", "T", "T", ""],
  ["O", "S", "T", "T", "T", "T", "S", "O"],
  ["", "", "S", "O", "O", "S", "", ""],
  ["", "", "P", "P", "P", "P", "", ""],
  ["", "", "P", "P", "P", "P", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
];

function applyPalette(template: C[][], palette: CharPalette): SpriteData {
  return template.map(row =>
    row.map(c => (c === "" ? "" : palette[c] ?? "")),
  );
}

function flipHorizontal(sprite: SpriteData): SpriteData {
  return sprite.map(row => [...row].reverse());
}

export interface CharacterSprites {
  idle: Record<string, SpriteData>;    // direction → sprite
  walk: Record<string, SpriteData[]>;  // direction → [frame0, frame1]
  typing: SpriteData;
}

export function getCharacterSprites(role: string): CharacterSprites {
  const p = PALETTES[role] ?? PALETTES.BACKEND;

  const down = applyPalette(TPL_DOWN, p);
  const up = applyPalette(TPL_UP, p);
  const right = applyPalette(TPL_RIGHT, p);
  const left = flipHorizontal(right);
  const walkDown = applyPalette(TPL_WALK_DOWN, p);
  const walkUp = applyPalette(TPL_UP, p); // same as idle up for now
  const walkRight = applyPalette(TPL_RIGHT, p);
  const walkLeft = flipHorizontal(walkRight);
  const typing = applyPalette(TPL_TYPING, p);

  return {
    idle: { DOWN: down, UP: up, LEFT: left, RIGHT: right },
    walk: {
      DOWN: [down, walkDown],
      UP: [up, walkUp],
      LEFT: [left, walkLeft],
      RIGHT: [right, walkRight],
    },
    typing,
  };
}

// --- Furniture Sprites ---

export const DESK_SPRITE: SpriteData = [
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A", "#5A4A3A"],
  ["#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48", "#6B5A48"],
  ["#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55", "#7A6A55"],
  ["#5A4A3A", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "#5A4A3A"],
  ["#5A4A3A", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "#5A4A3A"],
  ["#5A4A3A", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "#5A4A3A"],
  ["#4A3A2A", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "#4A3A2A"],
];

export const MONITOR_SPRITE: SpriteData = [
  ["", "", "#222", "#222", "#222", "#222", "#222", "#222", "#222", "#222", "", ""],
  ["", "", "#222", "#3A6888", "#3A6888", "#3A6888", "#3A6888", "#3A6888", "#3A6888", "#222", "", ""],
  ["", "", "#222", "#4A7898", "#4A7898", "#4A7898", "#4A7898", "#4A7898", "#4A7898", "#222", "", ""],
  ["", "", "#222", "#3A6888", "#3A6888", "#3A6888", "#3A6888", "#3A6888", "#3A6888", "#222", "", ""],
  ["", "", "#222", "#222", "#222", "#222", "#222", "#222", "#222", "#222", "", ""],
  ["", "", "", "", "", "#333", "#333", "", "", "", "", ""],
  ["", "", "", "", "#444", "#444", "#444", "#444", "", "", "", ""],
];

export const SOFA_SPRITE: SpriteData = [
  ["#5A3040", "#5A3040", "#5A3040", "#5A3040", "#5A3040", "#5A3040", "#5A3040", "#5A3040", "#5A3040", "#5A3040", "#5A3040", "#5A3040", "#5A3040", "#5A3040", "#5A3040", "#5A3040"],
  ["#6A4050", "#6A4050", "#6A4050", "#6A4050", "#6A4050", "#6A4050", "#6A4050", "#6A4050", "#6A4050", "#6A4050", "#6A4050", "#6A4050", "#6A4050", "#6A4050", "#6A4050", "#6A4050"],
  ["#7A5060", "#7A5060", "#8A6070", "#8A6070", "#8A6070", "#8A6070", "#8A6070", "#7A5060", "#7A5060", "#8A6070", "#8A6070", "#8A6070", "#8A6070", "#8A6070", "#7A5060", "#7A5060"],
  ["#7A5060", "#7A5060", "#8A6070", "#9A7080", "#9A7080", "#8A6070", "#8A6070", "#7A5060", "#7A5060", "#8A6070", "#8A6070", "#9A7080", "#9A7080", "#8A6070", "#7A5060", "#7A5060"],
  ["#6A4050", "#6A4050", "#7A5060", "#7A5060", "#7A5060", "#7A5060", "#7A5060", "#6A4050", "#6A4050", "#7A5060", "#7A5060", "#7A5060", "#7A5060", "#7A5060", "#6A4050", "#6A4050"],
  ["", "#4A2030", "", "", "", "", "", "", "", "", "", "", "", "", "#4A2030", ""],
];

// --- Bubble Sprites ---

export const BUBBLE_BG_COLOR = "#555566";
export const BUBBLE_FILL_COLOR = "#EEEEFF";
export const BUBBLE_AMBER = "#CCA700";
export const BUBBLE_GREEN = "#44BB66";

// --- Sprite Cache ---

const spriteCache = new Map<string, HTMLCanvasElement>();

export function renderSpriteToCanvas(
  sprite: SpriteData,
  zoom: number,
  cacheKey?: string,
): HTMLCanvasElement {
  if (cacheKey) {
    const cached = spriteCache.get(`${cacheKey}-${zoom}`);
    if (cached) return cached;
  }

  const rows = sprite.length;
  const cols = sprite[0]?.length ?? 0;
  const canvas = document.createElement("canvas");
  canvas.width = cols * zoom;
  canvas.height = rows * zoom;
  const ctx = canvas.getContext("2d")!;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = sprite[r][c];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(c * zoom, r * zoom, zoom, zoom);
    }
  }

  if (cacheKey) {
    spriteCache.set(`${cacheKey}-${zoom}`, canvas);
  }
  return canvas;
}

export function generateOutline(sprite: SpriteData): SpriteData {
  const rows = sprite.length;
  const cols = sprite[0]?.length ?? 0;
  const outline: SpriteData = Array.from({ length: rows + 2 }, () =>
    Array(cols + 2).fill(""),
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!sprite[r][c]) continue;
      // Mark 4-directional neighbors
      if (!outline[r][c + 1]) outline[r][c + 1] = "#FFFFFF";
      if (!outline[r + 2][c + 1]) outline[r + 2][c + 1] = "#FFFFFF";
      if (!outline[r + 1][c]) outline[r + 1][c] = "#FFFFFF";
      if (!outline[r + 1][c + 2]) outline[r + 1][c + 2] = "#FFFFFF";
    }
  }

  // Remove pixels that overlap with original
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (sprite[r][c]) outline[r + 1][c + 1] = "";
    }
  }

  return outline;
}
