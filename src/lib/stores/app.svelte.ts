// App state using Svelte 5 runes with class pattern
// This is the idiomatic way to manage global state in Svelte 5

import type { AppearanceStats } from "../types/types";

// Theme types
export const THEMES = ["default", "ocean", "aurora", "ember", "forest", "dusk"] as const;
export type Theme = (typeof THEMES)[number];

// Language types
export const LANGUAGES = ["default", "pt-BR", "en", "es", "ru"] as const;
export type Language = (typeof LANGUAGES)[number];

// Storage keys
const STORAGE_KEYS = {
    TIBIA_PATH: "lastTibiaPath",
    THEME: "selectedTheme",
    LANGUAGE: "selectedLanguage",
} as const;

// Helper to safely get from localStorage
function getFromStorage<T extends string>(key: string, fallback: T): T {
    if (typeof localStorage === "undefined") return fallback;
    return (localStorage.getItem(key) as T) ?? fallback;
}

// AppState class - Svelte 5 idiomatic pattern
class AppState {
    // Core state - public $state properties
    tibiaPath = $state<string>(getFromStorage(STORAGE_KEYS.TIBIA_PATH, ""));
    isLoading = $state(false);
    isLoaded = $state(false);
    loadingProgress = $state(0);
    loadingText = $state("Initializing...");

    // Stats
    stats = $state<AppearanceStats | null>(null);

    // Settings
    theme = $state<Theme>(getFromStorage(STORAGE_KEYS.THEME, "default") as Theme);
    language = $state<Language>(getFromStorage(STORAGE_KEYS.LANGUAGE, "default") as Language);

    // Navigation
    currentView = $state<"home" | "category" | "details">("home");
    currentCategory = $state<string | null>(null);

    // Methods to update state
    setTibiaPath(path: string) {
        this.tibiaPath = path;
        localStorage.setItem(STORAGE_KEYS.TIBIA_PATH, path);
    }

    setLoading(loading: boolean) {
        this.isLoading = loading;
    }

    setLoaded(loaded: boolean) {
        this.isLoaded = loaded;
    }

    setLoadingProgress(progress: number, text?: string) {
        this.loadingProgress = progress;
        if (text) this.loadingText = text;
    }

    setStats(newStats: AppearanceStats) {
        this.stats = newStats;
    }

    setTheme(newTheme: Theme) {
        this.theme = newTheme;
        localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
        document.body.className = `theme-${newTheme}`;
    }

    setLanguage(newLanguage: Language) {
        this.language = newLanguage;
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, newLanguage);
    }

    setCurrentView(view: "home" | "category" | "details") {
        this.currentView = view;
    }

    setCurrentCategory(category: string | null) {
        this.currentCategory = category;
    }

    reset() {
        this.isLoading = false;
        this.isLoaded = false;
        this.loadingProgress = 0;
        this.loadingText = "Initializing...";
        this.stats = null;
        this.currentView = "home";
        this.currentCategory = null;
    }
}

// Export singleton instance
export const appState = new AppState();
