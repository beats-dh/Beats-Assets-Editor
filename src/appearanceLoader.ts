import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import type { AppearanceStats } from "./types";
import { setUserTibiaPath } from "./spriteCache";

let appearancesLoaded = false;
let appearancesLoadPromise: Promise<void> | null = null;
let lastTibiaPath: string | null = null;
let cachedStats: AppearanceStats | null = null;

async function requestTibiaPath(): Promise<string> {
  try {
    const saved = await invoke<string | null>("get_tibia_base_path");
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
    await invoke("set_tibia_base_path", { tibiaPath: selection });
  } catch {
    // Persistência é opcional
  }

  return selection;
}

async function loadAppearancesFromPathInternal(tibiaPath: string): Promise<void> {
  setUserTibiaPath(tibiaPath);

  const files = await invoke<string[]>("list_appearance_files", { tibiaPath });
  if (!files || files.length === 0) {
    throw new Error("Nenhum arquivo de appearances (.dat) foi encontrado na pasta assets/.");
  }

  const assetsDir = await join(tibiaPath, "assets");
  let selectedFile = "appearances_latest.dat";
  if (!files.includes(selectedFile)) {
    selectedFile = files[0];
  }
  const appearancePath = await join(assetsDir, selectedFile);

  cachedStats = await invoke<AppearanceStats>("load_appearances_file", { path: appearancePath });
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
    cachedStats = await invoke<AppearanceStats>("get_appearance_stats");
  }
  return cachedStats;
}

export function areAppearancesLoaded(): boolean {
  return appearancesLoaded;
}

export function getCachedAppearanceStats(): AppearanceStats | null {
  return cachedStats;
}
