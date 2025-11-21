import { join } from "@tauri-apps/api/path";

// Import all modules
import type { AppearanceStats } from './types';
import { showStatus } from './utils';
import { debugCache } from './spriteCache';
import { invoke } from './utils/invoke';
import { COMMANDS, SELECTORS, CONSTANTS } from './commands';
import { querySelectorSafe } from './utils/dom';
import { loadAppearancesForAssetsEditor } from "./appearanceLoader";
import {
  initAssetUIElements,
  loadAssets,
  setupAssetsSearchListeners,
  setupAssetsCategoryListeners,
  setupAssetsPaginationListeners,
  clearPreviewSpriteCaches,
  clearAssetsQueryCaches
} from './assetUI';
import {
  showMainApp,
  setCurrentStats,
  updateHeaderStats
} from './navigation';
import { initAssetDetailsElements } from './assetDetails';
import { setupGlobalEventListeners } from './eventListeners';
import { loadSpecialMeaningIds } from './specialMeaning';
import { areSoundsLoaded, loadSoundsFile } from "./sounds";
import { setupImportExportFeature } from './importExport';
import { initSpriteLibraryUI } from './spriteLibrary';
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
import { initializeAppLauncher } from './mainMenu';

// Extend Window interface to include debugCache
declare global {
  interface Window {
    debugCache: typeof debugCache;
  }
}

// Use constants from commands module
const LAST_TIBIA_PATH_KEY = CONSTANTS.LAST_TIBIA_PATH_KEY;
const THEME_STORAGE_KEY = CONSTANTS.THEME_STORAGE_KEY;
const DEFAULT_THEME = CONSTANTS.DEFAULT_THEME as 'default';
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

function displayStats(stats: AppearanceStats): void {
  setCurrentStats(stats);
  updateHeaderStats();
}

function showAssetsBrowser(): void {
  const assetsBrowser = querySelectorSafe<HTMLElement>(SELECTORS.ASSETS_BROWSER);
  if (assetsBrowser) {
    assetsBrowser.style.display = "block";
  }
}

function initializeAssetsBrowser(): void {
  // Initialize asset browser elements
  initAssetUIElements();
  initAssetDetailsElements();
  setupImportExportFeature();
  initSpriteLibraryUI();

  // Setup search and scrolling behaviour
  setupAssetsSearchListeners();
  setupAssetsCategoryListeners();
  setupAssetsPaginationListeners();

  // Settings menu
  const settingsBtn = querySelectorSafe<HTMLButtonElement>(SELECTORS.SETTINGS_BTN);
  const settingsMenu = querySelectorSafe<HTMLElement>(SELECTORS.SETTINGS_MENU);
  const languageSelect = querySelectorSafe<HTMLSelectElement>(SELECTORS.LANGUAGE_SELECT);
  const themeOptionButtons = settingsMenu
    ? Array.from(settingsMenu.querySelectorAll<HTMLButtonElement>('.theme-option'))
    : [];
  const autoAnimateToggle = querySelectorSafe<HTMLInputElement>(SELECTORS.AUTO_ANIMATE_TOGGLE);
  const clearCacheBtn = querySelectorSafe<HTMLButtonElement>(SELECTORS.CLEAR_CACHE_BTN);
  const refreshBtn = querySelectorSafe<HTMLButtonElement>(SELECTORS.REFRESH_BTN);
  const homeBtn = querySelectorSafe<HTMLButtonElement>(SELECTORS.HOME_BTN);

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
    const stored = localStorage.getItem('autoAnimateGridEnabled');
    const enabled = stored === null ? false : stored === 'true';
    if (stored === null) {
      localStorage.setItem('autoAnimateGridEnabled', 'false');
    }
    autoAnimateToggle.checked = enabled;
    autoAnimateToggle.addEventListener('change', () => {
      const enabled = autoAnimateToggle.checked;
      localStorage.setItem('autoAnimateGridEnabled', String(enabled));
      location.reload(); // Reload to apply changes
    });
  }

  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', async () => {
      await debugCache.clearAllCaches();
      clearPreviewSpriteCaches();
      clearAssetsQueryCaches();
      showStatus(translate('status.cacheCleared'), 'success');
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      clearAssetsQueryCaches();
      clearPreviewSpriteCaches();
      await loadAssets();
      showStatus(translate('status.assetsRefreshed'), 'success');
    });
  }

  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      // Home button is handled in mainMenu.ts
      // It will open the launcher overlay
    });
  }
}

// Main initialization
window.addEventListener("DOMContentLoaded", async () => {
  const initialTheme = getStoredTheme();
  applyTheme(initialTheme);
  const initialLanguage = getStoredLanguage();
  applyLanguage(initialLanguage);

  // Initialize assets browser elements
  initializeAssetsBrowser();

  // Setup global event listeners
  setupGlobalEventListeners();

  initializeAppLauncher({
    onLauncherVisible: () => {
      const loadingScreen = querySelectorSafe<HTMLElement>(SELECTORS.LOADING_SCREEN);
      const mainApp = querySelectorSafe<HTMLElement>(SELECTORS.MAIN_APP);

      if (loadingScreen) {
        loadingScreen.style.display = 'none';
      }

      if (mainApp) {
        mainApp.style.display = 'none';
      }
    },
    onAssetsEditorSelected: async (tibiaPath: string) => {
      localStorage.setItem(LAST_TIBIA_PATH_KEY, tibiaPath);

      // Persist path to backend for use between sessions
      try {
        await invoke(COMMANDS.SET_TIBIA_BASE_PATH, { tibiaPath });
      } catch (_) {
        // Ignore errors
      }

      try {
        const result = await loadAppearancesForAssetsEditor(tibiaPath);

        // Load special meaning IDs for global access
        await loadSpecialMeaningIds();

        // Load sounds from the sounds directory
        try {
          const soundsDir = await join(tibiaPath, "sounds");
          if (!areSoundsLoaded()) {
            const stats = await loadSoundsFile(soundsDir);
            (window as any).__lastLoadedSoundCount = stats.total_sounds;
            console.log("Sounds loaded successfully");
          }

          // Update sounds count in header (if we have cached stats)
          const soundsCount = querySelectorSafe<HTMLElement>(SELECTORS.SOUNDS_COUNT);
          if (soundsCount) {
            const totalSounds = (window as any).__lastLoadedSoundCount as number | undefined;
            if (typeof totalSounds === 'number') {
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
  });
});

// Expose debugCache globally for console access
window.debugCache = debugCache;
