import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";

// Import all modules
import type { AppearanceStats } from './types';
import { showStatus, delay, updateProgress } from './utils';
import { setUserTibiaPath, debugCache } from './spriteCache';
import {
  initAssetUIElements,
  loadAssets,
  setupAssetsSearchListeners,
  setupAssetsCategoryListeners,
  setupAssetsPaginationListeners,
  setCurrentCategory,
  setCurrentPage,
  setCurrentSearch,
  setCurrentSubcategory
} from './assetUI';
import {
  showMainApp,
  setCurrentStats,
  showSetupSection,
  updateHeaderStats
} from './navigation';
import { initAssetDetailsElements } from './assetDetails';
import { setupGlobalEventListeners } from './eventListeners';
import { loadSpecialMeaningIds } from './specialMeaning';
import { setupImportExportFeature } from './importExport';
import { initExportImagesModal } from './exportimages';
import {
  applyDocumentTranslations,
  DEFAULT_LANGUAGE,
  getLanguageOptionLabel,
  getThemeLabel,
  LanguageCode,
  LANGUAGE_LOCALES,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  translate
} from './i18n';

// Extend Window interface to include debugCache
declare global {
  interface Window {
    debugCache: typeof debugCache;
  }
}

// Minimal global state needed for initialization
const LAST_TIBIA_PATH_KEY = 'lastTibiaPath';
const THEME_STORAGE_KEY = 'appThemePreference';
const DEFAULT_THEME = 'default' as const;
const SUPPORTED_THEMES = ['default', 'ocean', 'aurora', 'ember', 'forest', 'dusk'] as const;

type ThemeName = (typeof SUPPORTED_THEMES)[number];

const THEME_CLASSES = SUPPORTED_THEMES.map(theme => `theme-${theme}`);

function isLanguageCode(value: string): value is LanguageCode {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

function isThemeName(value: string): value is ThemeName {
  return (SUPPORTED_THEMES as readonly string[]).includes(value);
}

function getStoredLanguage(): LanguageCode {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored && isLanguageCode(stored) ? stored : DEFAULT_LANGUAGE;
}

function getStoredTheme(): ThemeName {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored && isThemeName(stored) ? stored : DEFAULT_THEME;
}

function applyLanguage(language: string, persist = false): LanguageCode {
  const normalized = isLanguageCode(language) ? language : DEFAULT_LANGUAGE;
  const locale = LANGUAGE_LOCALES[normalized];
  document.documentElement.setAttribute('lang', locale);
  if (document.body) {
    document.body.setAttribute('data-language', normalized);
  }
  applyDocumentTranslations(normalized);
  if (persist) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  }
  return normalized;
}

function applyTheme(theme: string, persist = false): ThemeName {
  const normalized = isThemeName(theme) ? theme : DEFAULT_THEME;
  const body = document.body;
  if (body) {
    THEME_CLASSES.forEach(cls => body.classList.remove(cls));
    body.classList.add(`theme-${normalized}`);
    body.setAttribute('data-theme', normalized);
  }
  if (persist) {
    localStorage.setItem(THEME_STORAGE_KEY, normalized);
  }
  return normalized;
}

// DOM references for setup screen
let tibiaPathInput: HTMLInputElement | null;
let loadButton: HTMLButtonElement | null;
let statsContainer: HTMLElement | null;
let filesList: HTMLElement | null;

async function loadAppearances(): Promise<void> {
  if (!tibiaPathInput) return;

  const tibiaPath = tibiaPathInput.value;

  if (!tibiaPath) {
    showStatus(translate('status.enterPath'), "error");
    return;
  }

  // Store the user's Tibia path for later use
  setUserTibiaPath(tibiaPath);
  localStorage.setItem(LAST_TIBIA_PATH_KEY, tibiaPath);

  // Persist path to backend for use between sessions
  try {
    await invoke("set_tibia_base_path", { tibiaPath });
  } catch (_) {
    // Ignore errors
  }

  try {
    // List available appearance files
    const files = await invoke<string[]>("list_appearance_files", { tibiaPath });

    if (files.length === 0) {
      showStatus(translate('status.noFilesFound'), "error");
      return;
    }

    displayFilesList(files);

    // Build paths using Tauri's path.join for cross-platform compatibility
    const assetsDir = await join(tibiaPath, "assets");

    // Try to load appearances_latest.dat first (our working copy)
    let appearancePath = await join(assetsDir, "appearances_latest.dat");

    // If that doesn't exist, fall back to the first file
    if (!files.includes("appearances_latest.dat")) {
      appearancePath = await join(assetsDir, files[0]);
    }

    const result = await invoke<AppearanceStats>("load_appearances_file", {
      path: appearancePath
    });

    // Load special meaning IDs for global access
    await loadSpecialMeaningIds();

    // Load sounds from the sounds directory
    try {
      const soundsDir = await join(tibiaPath, "sounds");
      await invoke("load_sounds_file", { soundsDir });
      console.log("Sounds loaded successfully");

      // Update sounds count in header
      const soundsCount = document.getElementById('sounds-count');
      if (soundsCount) {
        const stats = await invoke("get_sounds_stats");
        if (stats && typeof stats === 'object' && 'total_sounds' in stats) {
          const totalSounds = (stats as any).total_sounds as number;
          soundsCount.textContent = translate('count.items', { count: totalSounds });
        }
      }
    } catch (soundError) {
      console.warn("Failed to load sounds (this is optional):", soundError);
      // Don't fail the entire app if sounds fail to load
    }

    // Show main UI immediately after successfully loading appearances
    displayStats(result);
    showMainApp();

    // Then load grid content
    showAssetsBrowser();
    await loadAssets();

  } catch (error) {
    console.error('Error loading appearances:', error);
    const message = error instanceof Error ? error.message : String(error);
    showStatus(translate('status.loadError', { message }), "error");
  }
}

function displayStats(stats: AppearanceStats): void {
  setCurrentStats(stats);
  updateHeaderStats();

  // Hide stats container on header
  if (statsContainer) {
    statsContainer.innerHTML = "";
    statsContainer.style.display = "none";
  }
}

function displayFilesList(files: string[]): void {
  if (!filesList) return;

  filesList.innerHTML = `
    <h3>${translate('files.availableTitle')}</h3>
    <ul>
      ${files.map(file => `<li>${file}</li>`).join('')}
    </ul>
  `;
  filesList.style.display = "block";
}

async function browseTibiaPath(): Promise<void> {
  try {
    const selection = await open({ directory: true, multiple: false });
    if (typeof selection === 'string' && selection) {
      if (tibiaPathInput) {
        tibiaPathInput.value = selection;
        localStorage.setItem(LAST_TIBIA_PATH_KEY, selection);
        if (loadButton) loadButton.disabled = !tibiaPathInput.value.trim();
      }
    }
  } catch (err) {
    console.error('Failed to select directory:', err);
    showStatus(translate('status.directoryOpenFailed'), 'error');
  }
}

async function showLoadingScreen(): Promise<void> {
  updateProgress(0, translate('progress.step.initialize'));

  await delay(500);
  updateProgress(20, translate('progress.step.verify'));

  await delay(800);
  updateProgress(50, translate('progress.step.loadSettings'));

  await delay(600);
  updateProgress(80, translate('progress.step.prepare'));

  await delay(400);
  updateProgress(100, translate('progress.step.ready'));

  await delay(500);
  showSetupSection();
}

function showAssetsBrowser(): void {
  const assetsBrowser = document.querySelector('#assets-browser') as HTMLElement;
  if (assetsBrowser) {
    assetsBrowser.style.display = "block";
  }
}

function initializeAssetsBrowser(): void {
  // Initialize asset browser elements
  initAssetUIElements();
  initAssetDetailsElements();
  setupImportExportFeature();
  initExportImagesModal();

  // Setup search and scrolling behaviour
  setupAssetsSearchListeners();
  setupAssetsCategoryListeners();
  setupAssetsPaginationListeners();

  // Settings menu
  const settingsBtn = document.querySelector("#settings-btn") as HTMLButtonElement | null;
  const settingsMenu = document.getElementById('settings-menu') as HTMLElement | null;
  const languageSelect = document.getElementById('language-select') as HTMLSelectElement | null;
  const themeOptionButtons = settingsMenu
    ? Array.from(settingsMenu.querySelectorAll<HTMLButtonElement>('.theme-option'))
    : [];
  const autoAnimateToggle = document.getElementById('auto-animate-toggle') as HTMLInputElement | null;
  const clearCacheBtn = document.getElementById('clear-cache-btn') as HTMLButtonElement | null;
  const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement | null;
  const homeBtn = document.getElementById('home-btn') as HTMLButtonElement | null;

  const updateActiveThemeOption = (activeTheme: ThemeName) => {
    themeOptionButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.theme === activeTheme);
    });
  };

  if (settingsBtn && settingsMenu) {
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      settingsMenu.classList.remove('show');
    });

    settingsMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  const storedTheme = getStoredTheme();
  if (themeOptionButtons.length > 0) {
    updateActiveThemeOption(storedTheme);
    themeOptionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const desiredTheme = button.dataset.theme ?? DEFAULT_THEME;
        const appliedTheme = applyTheme(desiredTheme, true);
        updateActiveThemeOption(appliedTheme);
        showStatus(
          translate('status.themeApplied', { theme: getThemeLabel(appliedTheme) }),
          'success'
        );
      });
    });
  }

  if (languageSelect) {
    const storedLanguage = getStoredLanguage();
    languageSelect.value = storedLanguage;
    languageSelect.addEventListener('change', () => {
      const appliedLanguage = applyLanguage(languageSelect.value, true);
      languageSelect.value = appliedLanguage;
      showStatus(
        translate('status.languageUpdated', {
          language: getLanguageOptionLabel(appliedLanguage)
        }),
        'success'
      );
    });
  }

  if (autoAnimateToggle) {
    autoAnimateToggle.checked = localStorage.getItem('autoAnimateGridEnabled') === 'true';
    autoAnimateToggle.addEventListener('change', () => {
      const enabled = autoAnimateToggle.checked;
      localStorage.setItem('autoAnimateGridEnabled', String(enabled));
      location.reload(); // Reload to apply changes
    });
  }

  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', async () => {
      await debugCache.clearAllCaches();
      showStatus(translate('status.cacheCleared'), 'success');
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadAssets();
      showStatus(translate('status.assetsRefreshed'), 'success');
    });
  }

  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      const loadingScreen = document.querySelector('#loading-screen') as HTMLElement | null;
      const mainApp = document.querySelector('#main-app') as HTMLElement | null;

      if (mainApp) {
        mainApp.style.display = 'none';
      }
      if (loadingScreen) {
        loadingScreen.style.display = 'flex';
      }

      showSetupSection();
      setCurrentCategory('Objects');
      setCurrentPage(0);
      setCurrentSearch('');
      setCurrentSubcategory('All');
    });
  }
}

// Main initialization
window.addEventListener("DOMContentLoaded", async () => {
  const initialTheme = getStoredTheme();
  applyTheme(initialTheme);
  const initialLanguage = getStoredLanguage();
  applyLanguage(initialLanguage);

  tibiaPathInput = document.querySelector("#tibia-path");
  loadButton = document.querySelector("#load-button");
  statsContainer = document.querySelector("#header-stats");
  filesList = document.querySelector("#files-list");

  const savedPath = localStorage.getItem(LAST_TIBIA_PATH_KEY);
  let persistedPath: string | null = null;
  try {
    persistedPath = await invoke<string | null>("get_tibia_base_path");
  } catch (_) {
    // Ignore errors
  }

  if (tibiaPathInput) {
    const initialPath = persistedPath && persistedPath.trim() ? persistedPath : (savedPath || "");
    tibiaPathInput.value = initialPath;
  }

  // Disable load button until valid path is entered
  if (loadButton) {
    loadButton.disabled = !(tibiaPathInput && tibiaPathInput.value.trim());
  }

  // Enable/disable load button as user types
  tibiaPathInput?.addEventListener('input', () => {
    if (loadButton && tibiaPathInput) {
      loadButton.disabled = !tibiaPathInput.value.trim();
    }
  });

  loadButton?.addEventListener("click", loadAppearances);

  document.querySelector("#browse-dir")?.addEventListener("click", browseTibiaPath);

  // Initialize assets browser elements
  initializeAssetsBrowser();

  // Setup global event listeners
  setupGlobalEventListeners();

  // Start loading screen
  await showLoadingScreen();
});

// Expose debugCache globally for console access
window.debugCache = debugCache;
