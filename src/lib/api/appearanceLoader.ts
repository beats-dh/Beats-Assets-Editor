import { join } from "@tauri-apps/api/path";
import type { AppearanceStats } from "../types/types";
import { invoke } from "./invoke";
import { COMMANDS } from "./commands";

let appearancesLoaded = false;
let appearancesLoadPromise: Promise<void> | null = null;
let lastTibiaPath: string | null = null;
let cachedStats: AppearanceStats | null = null;

// Store the user's Tibia path for sprite loading later
let userTibiaPath: string | null = null;

export function setUserTibiaPath(path: string): void {
  userTibiaPath = path;
}

export function getUserTibiaPath(): string | null {
  return userTibiaPath;
}

async function requestTibiaPath(): Promise<string> {
  try {
    const saved = await invoke<string | null>(COMMANDS.GET_TIBIA_BASE_PATH);
    if (saved) {
      return saved;
    }
  } catch {
    // ignore, will prompt below
  }

  const { open } = await import("@tauri-apps/plugin-dialog");
  const selection = await open({
    directory: true,
    multiple: false,
    title: "Selecione o diretório do Tibia (contendo a pasta assets/)",
  });

  if (typeof selection !== "string" || !selection) {
    throw new Error("É necessário selecionar a pasta do Tibia para carregar o arquivo de assets (.dat).");
  }

  try {
    await invoke(COMMANDS.SET_TIBIA_BASE_PATH, { tibiaPath: selection });
  } catch {
    // Persistência é opcional
  }

  return selection;
}

async function loadAppearancesFromPathInternal(tibiaPath: string): Promise<void> {
  setUserTibiaPath(tibiaPath);

  const files = await invoke<string[]>(COMMANDS.LIST_APPEARANCE_FILES, { tibiaPath });
  if (!files || files.length === 0) {
    throw new Error("Nenhum arquivo de appearances (.dat) foi encontrado na pasta assets/.");
  }

  const assetsDir = await join(tibiaPath, "assets");
  let selectedFile = "appearances_latest.dat";
  if (!files.includes(selectedFile)) {
    selectedFile = files[0];
  }
  const appearancePath = await join(assetsDir, selectedFile);

  cachedStats = await invoke<AppearanceStats>(COMMANDS.LOAD_APPEARANCES_FILE, { path: appearancePath });

  // Also load sprites catalog so sprites can be displayed
  try {
    await invoke(COMMANDS.AUTO_LOAD_SPRITES, { tibiaPath });
    console.log("Sprites loaded successfully");
  } catch (e) {
    console.warn("Failed to load sprites (optional):", e);
  }

  appearancesLoaded = true;
  lastTibiaPath = tibiaPath;
}

export async function ensureAppearancesLoaded(requestedPath?: string): Promise<void> {
  const tibiaPath = requestedPath ?? (await requestTibiaPath());

  if (appearancesLoaded && lastTibiaPath === tibiaPath) {
    return;
  }

  if (appearancesLoadPromise) {
    await appearancesLoadPromise;
    if (appearancesLoaded && lastTibiaPath === tibiaPath) {
      return;
    }
  }

  appearancesLoadPromise = (async () => {
    await loadAppearancesFromPathInternal(tibiaPath);
  })();

  try {
    await appearancesLoadPromise;
  } finally {
    appearancesLoadPromise = null;
  }
}

export async function loadAppearancesForAssetsEditor(tibiaPath: string): Promise<AppearanceStats> {
  await ensureAppearancesLoaded(tibiaPath);
  if (!cachedStats) {
    cachedStats = await invoke<AppearanceStats>(COMMANDS.GET_APPEARANCE_STATS);
  }
  if (!cachedStats) {
    throw new Error("Failed to load appearance stats");
  }
  return cachedStats;
}

export function areAppearancesLoaded(): boolean {
  return appearancesLoaded;
}

export function getCachedAppearanceStats(): AppearanceStats | null {
  return cachedStats;
}
