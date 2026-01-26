import { writable } from 'svelte/store';

const THEME_STORAGE_KEY = 'appThemePreference';
const LANGUAGE_STORAGE_KEY = 'appLanguage';

const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'default';
const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'default';

export const theme = writable<string>(storedTheme);
export const language = writable<string>(storedLanguage);

theme.subscribe(value => {
  localStorage.setItem(THEME_STORAGE_KEY, value);
  document.body.className = '';
  document.body.classList.add(`theme-${value}`);
  document.body.setAttribute('data-theme', value);
});

language.subscribe(value => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  // Note: Actual translation logic will be handled by the i18n module subscribing to this or manually triggered
});
