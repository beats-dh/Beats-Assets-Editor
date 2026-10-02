// Tibia / OTClient 8-bit color palette.
//
// Used for an object's *light* color and *minimap (automap)* color — these are
// NOT the 133-entry outfit palette (head/body/legs/feet). It mirrors OTClient's
// `Color::from8bit`: a 6x6x6 RGB cube with steps of 51, valid range 0..215
// (0 == black / "no color").

export const TIBIA_8BIT_COLOR_COUNT = 216;

export function clamp8bitColorId(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const v = Math.trunc(value);
  if (v < 0) return 0;
  if (v > TIBIA_8BIT_COLOR_COUNT - 1) return TIBIA_8BIT_COLOR_COUNT - 1;
  return v;
}

export function color8bitToRgb(color: number): [number, number, number] {
  const c = clamp8bitColorId(color);
  if (c === 0) return [0, 0, 0];
  const r = (Math.floor(c / 36) % 6) * 51;
  const g = (Math.floor(c / 6) % 6) * 51;
  const b = (c % 6) * 51;
  return [r, g, b];
}

function toHex2(n: number): string {
  return n.toString(16).padStart(2, "0");
}

export function color8bitToHex(color: number): string {
  const [r, g, b] = color8bitToRgb(color);
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

export function nearest8bitColorId(hex: string): number {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return 0;
  const int = Number.parseInt(match[1], 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < TIBIA_8BIT_COLOR_COUNT; i++) {
    const [cr, cg, cb] = color8bitToRgb(i);
    const dist = (cr - r) ** 2 + (cg - g) ** 2 + (cb - b) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}
