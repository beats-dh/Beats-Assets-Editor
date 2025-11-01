import './mainMenu.css';
import { createMonsterEditorView, createNpcEditorView } from './monsters-npc';
import {
  applyDocumentTranslations,
  DEFAULT_LANGUAGE,
  LanguageCode,
  LANGUAGE_LOCALES,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES
} from './i18n';

type ThemeName = 'default' | 'ocean' | 'aurora' | 'ember' | 'forest' | 'dusk';

type LauncherCallbacks = {
  onLauncherVisible?: () => void;
  onAssetsEditorSelected?: () => void | Promise<void>;
};

const THEME_STORAGE_KEY = 'appThemePreference';
const DEFAULT_THEME: ThemeName = 'default';
const SUPPORTED_THEMES: ThemeName[] = ['default', 'ocean', 'aurora', 'ember', 'forest', 'dusk'];
const THEME_CLASSES = SUPPORTED_THEMES.map(theme => `theme-${theme}`);

const THEME_LABELS: Record<ThemeName, string> = {
  default: 'Royal (default)',
  ocean: 'Oceanic',
  aurora: 'Aurora',
  ember: 'Ember',
  forest: 'Forest',
  dusk: 'Dusk'
};

function isThemeName(value: string): value is ThemeName {
  return SUPPORTED_THEMES.includes(value as ThemeName);
}

function getStoredTheme(): ThemeName {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored && isThemeName(stored) ? stored : DEFAULT_THEME;
}

function applyThemePreference(theme: string, persist = false): ThemeName {
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

function isLanguageCode(value: string): value is LanguageCode {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

function getStoredLanguage(): LanguageCode {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored && isLanguageCode(stored) ? stored : DEFAULT_LANGUAGE;
}

function applyLanguagePreference(language: string, persist = false): LanguageCode {
  const normalized = isLanguageCode(language) ? language : DEFAULT_LANGUAGE;
  const locale = LANGUAGE_LOCALES[normalized];
  document.documentElement.setAttribute('lang', locale);
  document.body?.setAttribute('data-language', normalized);
  applyDocumentTranslations(normalized);
  if (persist) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  }
  return normalized;
}

let openLauncherHomeCallback: (() => void) | null = null;

export function openAppLauncherHome(): void {
  if (!openLauncherHomeCallback) {
    console.warn('App launcher is not ready yet. Call initializeAppLauncher() first.');
    return;
  }

  openLauncherHomeCallback();
}

function createOptionButton(
  label: string,
  description: string,
  icon: string,
  onClick: () => void,
  options: { badge?: string; disabled?: boolean; badgeClass?: string } = {}
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'launcher-option';

  if (options.disabled) {
    button.classList.add('disabled');
    button.disabled = true;
  }

  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'launcher-option-icon';
  iconWrapper.textContent = icon;

  const title = document.createElement('h3');
  title.textContent = label;

  const details = document.createElement('p');
  details.textContent = description;

  button.append(iconWrapper, title, details);

  if (options.badge) {
    const badge = document.createElement('span');
    badge.className = 'launcher-option-badge';
    if (options.badgeClass) {
      badge.classList.add(options.badgeClass);
    }
    badge.textContent = options.badge;
    button.append(badge);
  }

  if (!options.disabled) {
    button.addEventListener('click', onClick);
  }

  return button;
}

function createConfigurationsSection(
  onLanguageChange: (language: string) => void,
  onThemeChange: (theme: string) => void,
  onRefresh: () => void
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'launcher-configurations';

  const themeGroup = document.createElement('div');
  themeGroup.className = 'config-group';
  const themeLabel = document.createElement('label');
  themeLabel.textContent = 'Interface colour';
  const themeSelect = document.createElement('select');
  themeSelect.className = 'config-select';
  SUPPORTED_THEMES.forEach(theme => {
    const option = document.createElement('option');
    option.value = theme;
    option.textContent = THEME_LABELS[theme];
    themeSelect.append(option);
  });
  themeSelect.value = getStoredTheme();
  themeSelect.addEventListener('change', () => {
    const applied = applyThemePreference(themeSelect.value, true);
    themeSelect.value = applied;
    onThemeChange(applied);
  });
  themeGroup.append(themeLabel, themeSelect);

  const languageGroup = document.createElement('div');
  languageGroup.className = 'config-group';
  const languageLabel = document.createElement('label');
  languageLabel.textContent = 'Language';
  const languageSelect = document.createElement('select');
  languageSelect.className = 'config-select';
  (SUPPORTED_LANGUAGES as readonly LanguageCode[]).forEach(language => {
    const option = document.createElement('option');
    option.value = language;
    option.textContent = language === 'default' ? 'Auto (multilingual)' : language;
    languageSelect.append(option);
  });
  languageSelect.value = getStoredLanguage();
  languageSelect.addEventListener('change', () => {
    const applied = applyLanguagePreference(languageSelect.value, true);
    languageSelect.value = applied;
    onLanguageChange(applied);
  });
  languageGroup.append(languageLabel, languageSelect);

  const refreshGroup = document.createElement('div');
  refreshGroup.className = 'config-group';
  const refreshLabel = document.createElement('label');
  refreshLabel.textContent = 'Maintenance';
  const refreshButton = document.createElement('button');
  refreshButton.type = 'button';
  refreshButton.className = 'refresh-button';
  refreshButton.innerHTML = '<span aria-hidden="true">🔄</span> Refresh application';
  refreshButton.addEventListener('click', onRefresh);
  refreshGroup.append(refreshLabel, refreshButton);

  section.append(themeGroup, languageGroup, refreshGroup);
  return section;
}

export function initializeAppLauncher(callbacks: LauncherCallbacks = {}): void {
  if (document.getElementById('app-launcher')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'app-launcher';
  overlay.className = 'app-launcher-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const card = document.createElement('div');
  card.className = 'app-launcher-card';

  const view = document.createElement('div');
  view.className = 'launcher-view';

  card.append(view);
  overlay.append(card);
  document.body.append(overlay);

  const hideOverlay = () => {
    overlay.setAttribute('aria-hidden', 'true');
  };

  const showOverlay = () => {
    overlay.setAttribute('aria-hidden', 'false');
    callbacks.onLauncherVisible?.();
  };

  function ensureReturnButton(): void {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions || headerActions.querySelector('.header-return-button')) {
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-secondary header-return-button';
    button.innerHTML = '<span class="btn-icon">🏠</span><span>Return to main menu</span>';
    button.addEventListener('click', () => {
      renderHome();
    });

    const homeButton = headerActions.querySelector('#home-btn');
    if (homeButton && homeButton.parentElement === headerActions) {
      headerActions.insertBefore(button, homeButton);
    } else {
      headerActions.append(button);
    }
  }

  const renderHome = () => {
    view.innerHTML = '';

    const hero = document.createElement('section');
    hero.className = 'launcher-hero';
    const title = document.createElement('h1');
    title.className = 'launcher-title';
    title.textContent = 'Tibia creation suite';
    const subtitle = document.createElement('p');
    subtitle.className = 'launcher-subtitle';
    subtitle.textContent = 'Choose an editor to get started or adjust your preferences before diving in.';
    hero.append(title, subtitle);

    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'launcher-options-grid';

    const assetsOption = createOptionButton(
      'Assets editor',
      'Browse, edit and export appearance assets with the modern workflow.',
      '🗃️',
      () => {
        hideOverlay();
        callbacks.onAssetsEditorSelected?.();
      },
      { badge: 'Current' }
    );

    const monsterOption = createOptionButton(
      'Monster editor',
      'Select a monster scripts folder to load encounter data just like assets.',
      '🐲',
      () => {
        view.innerHTML = '';
        view.append(createMonsterEditorView({ onBack: renderHome }));
      }
    );

    const npcOption = createOptionButton(
      'NPC editor',
      'Choose an NPC scripts directory and prepare dialogue for editing.',
      '🧙',
      () => {
        view.innerHTML = '';
        view.append(createNpcEditorView({ onBack: renderHome }));
      }
    );

    const mapOption = createOptionButton(
      'Map editor',
      'Plan zones and biomes with procedural tools (coming soon).',
      '🗺️',
      () => {
        alert('The Map editor is under construction and will be available soon.');
      },
      { badge: 'Coming up', disabled: true, badgeClass: 'upcoming' }
    );

    optionsGrid.append(assetsOption, monsterOption, npcOption, mapOption);

    const configurations = createConfigurationsSection(
      () => {
        // Intentionally empty — the callback allows future hooks.
      },
      () => {
        // Placeholder for future theme sync if needed.
      },
      () => window.location.reload()
    );

    view.append(hero, optionsGrid, configurations);
    showOverlay();
    ensureReturnButton();
  };

  openLauncherHomeCallback = () => {
    renderHome();
  };

  renderHome();

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }
    if (target.id === 'home-btn' || target.closest('#home-btn')) {
      renderHome();
    }
  });
}
