// Settings state using Svelte 5 runes
const THEME_STORAGE_KEY = 'appThemePreference';
const LANGUAGE_STORAGE_KEY = 'appLanguage';

function createSettingsState() {
    const state = $state({
        theme: localStorage.getItem(THEME_STORAGE_KEY) || 'default',
        language: localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'default',
    });

    // Persist and apply theme/language reactively
    $effect.root(() => {
        $effect(() => {
            localStorage.setItem(THEME_STORAGE_KEY, state.theme);
            document.body.className = '';
            document.body.classList.add(`theme-${state.theme}`);
            document.body.setAttribute('data-theme', state.theme);
        });
        $effect(() => {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
        });
    });

    return state;
}

export const settingsState = createSettingsState();
