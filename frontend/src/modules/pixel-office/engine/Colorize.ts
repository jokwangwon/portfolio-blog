// Pixel-agents inspired HSL Colorize/Adjust system
// Grayscale → HSL colorization for floors/walls
// Original HSL shift for furniture/characters

export interface ColorValue {
  h: number; // Colorize: 0-360, Adjust: -180~+180
  s: number; // Colorize: 0-100, Adjust: -100~+100
  b: number; // Brightness: -100~+100
  c: number; // Contrast: -100~+100
}

export function colorizeGray(
  gray: number, // 0-255 grayscale
  color: ColorValue,
): string {
  // Perceived luminance
  let lightness = gray / 255;

  // Contrast
  lightness = 0.5 + (lightness - 0.5) * ((100 + color.c) / 100);

  // Brightness
  lightness = lightness + color.b / 200;

  // Clamp
  lightness = Math.max(0, Math.min(1, lightness));

  return hslToHex(color.h, color.s / 100, lightness);
}

export function wallColorToHex(color: ColorValue): string {
  return colorizeGray(128, color); // 50% gray base
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
