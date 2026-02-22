import type { MonsterListEntry } from '../../../monsterTypes';

export type MonsterCategoryNode = {
  name: string;
  path: string;
  children: Map<string, MonsterCategoryNode>;
  monsters: MonsterListEntry[];
};

export const UNKNOWN_CLASS_NAME = "Unknown";

export const CATEGORY_ICON_MAP: Record<string, string> = {
  amphibic: "🐸", amphibics: "🐸", aquatic: "🐠", aquatics: "🐠",
  animal: "🐾", animals: "🐾", bird: "🐦", birds: "🐦",
  boss: "👑", bosses: "👑", construct: "🏗️", constructs: "🏗️",
  custom: "❓", dawnport: "🌅", demon: "😈", demons: "😈",
  dragon: "🐉", dragons: "🐉", elemental: "🔥", elementals: "🔥",
  event_creatures: "🎉", event: "🎊", extra_dimensional: "🌀",
  familiars: "🧿", familiars_event: "🎭", fey: "🧚",
  giant: "🗿", giants: "🗿", humanoid: "🧍", humanoids: "🧍",
  human: "🧑", humans: "🧑", inkborn: "🦑", insect: "🐞",
  insects: "🐞", lycanthrope: "🐺", lycanthropes: "🐺",
  machine: "⚙️", machines: "⚙️", magical: "✨", mammal: "🦬",
  mammals: "🦬", mutant: "🧬", mutants: "🧬", orc: "🪓",
  orcs: "🪓", plant: "🌿", plants: "🌿", reptile: "🐍",
  reptiles: "🐍", slime: "🟢", slimes: "🟢", undead: "💀",
  vampire: "🩸", vampires: "🩸", vermin: "🐀", unknown: "❔",
};

export function getCategoryIcon(categoryName: string): string {
  const normalized = categoryName.toLowerCase().replace(/\s+/g, "_");
  return CATEGORY_ICON_MAP[normalized] ?? "??";
}

export function formatBestiaryClassName(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/_/g, " ").trim();
  if (!cleaned) return null;
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function getBestiaryClassLabel(entry: MonsterListEntry): string {
  return formatBestiaryClassName(entry.bestiaryClass) ?? UNKNOWN_CLASS_NAME;
}

export function buildMonsterTree(entries: MonsterListEntry[]): MonsterCategoryNode {
  const root: MonsterCategoryNode = {
    name: "__root__",
    path: "",
    children: new Map(),
    monsters: [],
  };

  entries.forEach((entry) => {
    const categories = Array.isArray(entry.categories) ? entry.categories : [];
    let cursor = root;
    categories.forEach((category) => {
      if (!cursor.children.has(category)) {
        const nextPath = cursor.path ? `${cursor.path}/${category}` : category;
        cursor.children.set(category, {
          name: category,
          path: nextPath,
          children: new Map(),
          monsters: [],
        });
      }
      cursor = cursor.children.get(category)!;
    });
    cursor.monsters.push(entry);
  });

  return root;
}

export function countMonstersInNode(node: MonsterCategoryNode): number {
  let total = node.monsters.length;
  node.children.forEach((child) => {
    total += countMonstersInNode(child);
  });
  return total;
}

export function sortCategoryNodes(nodes: MonsterCategoryNode[], classOrder: string[]): MonsterCategoryNode[] {
  if (nodes.length === 0) return nodes;
  const orderMap = new Map<string, number>(
    classOrder.map((name, index) => [name.toLowerCase(), index])
  );

  return nodes.sort((a, b) => {
    const aIndex = getCategoryOrderIndex(a.name, orderMap);
    const bIndex = getCategoryOrderIndex(b.name, orderMap);
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

function getCategoryOrderIndex(name: string, orderMap: Map<string, number>): number {
  const normalized = name.toLowerCase();
  if (normalized === "bosses") {
    return Number.MAX_SAFE_INTEGER - 1;
  }
  return orderMap.get(normalized) ?? Number.MAX_SAFE_INTEGER;
}

// Color Utils
export const OUTFIT_COLOR_COUNT = 19 * 7;

export function outfitColorIdToRgb(colorId: number): { r: number; g: number; b: number } {
  const HSI_SI_VALUES = 7;
  const HSI_H_STEPS = 19;

  let color = Math.max(0, Math.floor(colorId));
  if (color >= HSI_H_STEPS * HSI_SI_VALUES) {
    color = 0;
  }

  let loc1 = 0;
  let loc2 = 0;
  let loc3 = 0;

  if (color % HSI_H_STEPS !== 0) {
    loc1 = (color % HSI_H_STEPS) / 18;
    loc2 = 1;
    loc3 = 1;

    switch (Math.floor(color / HSI_H_STEPS)) {
      case 0:
        loc2 = 0.25;
        loc3 = 1.0;
        break;
      case 1:
        loc2 = 0.25;
        loc3 = 0.75;
        break;
      case 2:
        loc2 = 0.5;
        loc3 = 0.75;
        break;
      case 3:
        loc2 = 2 / 3;
        loc3 = 0.75;
        break;
      case 4:
        loc2 = 1.0;
        loc3 = 1.0;
        break;
      case 5:
        loc2 = 1.0;
        loc3 = 0.75;
        break;
      case 6:
        loc2 = 1.0;
        loc3 = 0.5;
        break;
      default:
        break;
    }
  } else {
    loc1 = 0;
    loc2 = 0;
    loc3 = 1 - color / HSI_H_STEPS / HSI_SI_VALUES;
  }

  if (loc3 === 0) {
    return { r: 0, g: 0, b: 0 };
  }

  if (loc2 === 0) {
    const grey = clampByte(loc3 * 255);
    return { r: grey, g: grey, b: grey };
  }

  let red = 0;
  let green = 0;
  let blue = 0;

  if (loc1 < 1 / 6) {
    red = loc3;
    blue = loc3 * (1 - loc2);
    green = blue + (loc3 - blue) * 6 * loc1;
  } else if (loc1 < 2 / 6) {
    green = loc3;
    blue = loc3 * (1 - loc2);
    red = green - (loc3 - blue) * (6 * loc1 - 1);
  } else if (loc1 < 3 / 6) {
    green = loc3;
    red = loc3 * (1 - loc2);
    blue = red + (loc3 - red) * (6 * loc1 - 2);
  } else if (loc1 < 4 / 6) {
    blue = loc3;
    red = loc3 * (1 - loc2);
    green = blue - (loc3 - red) * (6 * loc1 - 3);
  } else if (loc1 < 5 / 6) {
    blue = loc3;
    green = loc3 * (1 - loc2);
    red = green + (loc3 - green) * (6 * loc1 - 4);
  } else {
    red = loc3;
    green = loc3 * (1 - loc2);
    blue = red - (loc3 - green) * (6 * loc1 - 5);
  }

  return {
    r: clampByte(red * 255),
    g: clampByte(green * 255),
    b: clampByte(blue * 255),
  };
}

export function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function clampColorId(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(OUTFIT_COLOR_COUNT - 1, Math.round(value)));
}

export function rgbToCss(color: { r: number; g: number; b: number }): string {
  const toHex = (component: number) => clampByte(component).toString(16).padStart(2, "0");
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

export function normalizeHex(hex: string): string {
  let value = hex.trim().toLowerCase();
  if (!value.startsWith("#")) {
    value = `#${value}`;
  }
  if (value.length === 4) {
    value = `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return value;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex).slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
}

export const outfitColorHexCache = Array.from({ length: OUTFIT_COLOR_COUNT }, (_, id) => rgbToCss(outfitColorIdToRgb(id)));
export const outfitColorRgbCache = Array.from({ length: OUTFIT_COLOR_COUNT }, (_, id) => outfitColorIdToRgb(id));

export function findClosestColorId(rgb: { r: number; g: number; b: number }): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < outfitColorRgbCache.length; i += 1) {
    const color = outfitColorRgbCache[i];
    const dr = color.r - rgb.r;
    const dg = color.g - rgb.g;
    const db = color.b - rgb.b;
    const distance = dr * dr + dg * dg + db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}
