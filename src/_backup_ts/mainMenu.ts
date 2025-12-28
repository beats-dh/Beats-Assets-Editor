import './mainMenu.css';
import { createMonsterEditorView } from './monsterEditor';
import { createNpcEditorView } from './npcEditor';
import { invoke } from './utils/invoke';
import { COMMANDS } from './commands';
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
  onAssetsEditorSelected?: (tibiaPath: string) => void | Promise<void>;
};

const THEME_STORAGE_KEY = 'appThemePreference';
const DEFAULT_THEME: ThemeName = 'default';
const SUPPORTED_THEMES: ThemeName[] = ['default', 'ocean', 'aurora', 'ember', 'forest', 'dusk'];
const THEME_CLASSES = SUPPORTED_THEMES.map(theme => `theme-${theme}`);
const LAST_TIBIA_PATH_KEY = 'lastTibiaPath';

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
  iconText: string,
  onClick: (event: MouseEvent) => void,
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
  iconWrapper.textContent = iconText;

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
    button.addEventListener('click', (event) => onClick(event));
  }

  return button;
}

function createTibiaPathSection(
  onPathChange: (path: string) => void
): { section: HTMLElement; input: HTMLInputElement } {
  const section = document.createElement('section');
  section.className = 'launcher-tibia-path-section';

  const title = document.createElement('h3');
  title.className = 'launcher-section-title';
  title.textContent = 'Tibia Client Configuration';

  const description = document.createElement('p');
  description.className = 'launcher-secondary-text';
  description.textContent = 'Select your Tibia client directory to enable the editors below.';

  const inputGroup = document.createElement('div');
  inputGroup.className = 'launcher-path-input-group';

  const label = document.createElement('label');
  label.className = 'launcher-path-label';

  const inputRow = document.createElement('div');
  inputRow.className = 'launcher-path-input-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'launcher-path-input';
  input.placeholder = 'C:\\Path\\To\\Tibia';
  input.autocomplete = 'off';
  input.value = localStorage.getItem(LAST_TIBIA_PATH_KEY) || '';

  const browseButton = document.createElement('button');
  browseButton.type = 'button';
  browseButton.className = 'btn-secondary';
  browseButton.innerHTML = '<span class="btn-icon">📁</span><span>Browse</span>';

  browseButton.addEventListener('click', async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selection = await open({ directory: true, multiple: false });
      if (typeof selection === 'string' && selection) {
        input.value = selection;
        localStorage.setItem(LAST_TIBIA_PATH_KEY, selection);
        onPathChange(selection);
      }
    } catch (error) {
      console.error('Failed to open directory chooser:', error);
    }
  });

  input.addEventListener('input', () => {
    const value = input.value.trim();
    if (value) {
      localStorage.setItem(LAST_TIBIA_PATH_KEY, value);
    } else {
      localStorage.removeItem(LAST_TIBIA_PATH_KEY);
    }
    onPathChange(value);
  });

  inputRow.append(input, browseButton);
  inputGroup.append(label, inputRow);
  section.append(title, description, inputGroup);

  return { section, input };
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
  let cachedMonsterView: HTMLElement | null = null;
  let cachedMonsterPath: string | null = null;

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

    // Add Tibia path section
    const updateEditorButtons = (path: string) => {
      const hasPath = path.trim().length > 0;
      assetsOption.disabled = !hasPath;
      assetsOption.classList.toggle('disabled', !hasPath);
      if (!hasPath) {
        assetsOption.title = 'Please select a Tibia client path first';
      } else {
        assetsOption.title = '';
      }
    };

    const { section: tibiaPathSection, input: tibiaPathInput } = createTibiaPathSection(updateEditorButtons);

    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'launcher-options-grid';

    const assetsOption = createOptionButton(
      'Assets editor',
      'Browse, edit and export appearance assets with the modern workflow.',
      '🗂️',
      () => {
        const tibiaPath = tibiaPathInput.value.trim();
        if (!tibiaPath) {
          return;
        }
        hideOverlay();
        callbacks.onAssetsEditorSelected?.(tibiaPath);
      },
      { badge: 'Current', disabled: !tibiaPathInput.value.trim() }
    );

    const openMonsterEditor = async (forceSelect = false) => {
      try {
        let monsterPath: string | null = null;

        if (!forceSelect) {
          monsterPath = cachedMonsterPath;
          if (!monsterPath) {
            try {
              monsterPath = await invoke<string | null>("get_monster_base_path");
            } catch (error) {
              console.warn('Failed to read saved monster path:', error);
            }
          }
        }

        if (!monsterPath) {
          const { open } = await import('@tauri-apps/plugin-dialog');
          const selection = await open({ directory: true, multiple: false });
          if (typeof selection !== 'string' || !selection) {
            return;
          }
          monsterPath = selection;
          try {
            await invoke(COMMANDS.SET_MONSTER_BASE_PATH, { monsterPath: selection });
          } catch (persistError) {
            console.warn('Failed to persist monster path:', persistError);
          }
          cachedMonsterView = null;
        }

        if (!monsterPath) {
          return;
        }

        if (cachedMonsterView && cachedMonsterPath === monsterPath) {
          view.innerHTML = '';
          view.append(cachedMonsterView);
          return;
        }

        const monsterView = createMonsterEditorView({
          onBack: () => {
            view.innerHTML = '';
            renderHome();
          },
          monstersPath: monsterPath,
        });

        cachedMonsterView = monsterView;
        cachedMonsterPath = monsterPath;
        view.innerHTML = '';
        view.append(monsterView);
      } catch (error) {
        console.error('Failed to open monster editor:', error);
        if (!forceSelect) {
          try {
            await openMonsterEditor(true);
            return;
          } catch (innerError) {
            console.error('Failed to select monster folder after retry:', innerError);
          }
        }
        alert('Failed to select monster scripts folder');
      }
    };

    const monsterOption = createOptionButton(
      'Monster editor',
      'Select a monster scripts folder to load encounter data just like assets.',
      '👾',
      async (event) => {
        await openMonsterEditor(Boolean(event?.shiftKey || event?.altKey));
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

    // Initial state update
    updateEditorButtons(tibiaPathInput.value);

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

    view.append(hero, tibiaPathSection, optionsGrid, configurations);
    showOverlay();
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
