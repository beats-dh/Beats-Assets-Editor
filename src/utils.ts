import type { CompleteFlags, VocationOption } from './types';
import { translate, type TranslationKey } from './i18n';

// VOCATION enum helpers para UI
const VOCATION_OPTION_KEYS: ReadonlyArray<{ value: number; key: TranslationKey }> = [
  { value: -1, key: 'vocation.any' },
  { value: 0, key: 'vocation.none' },
  { value: 1, key: 'vocation.knight' },
  { value: 2, key: 'vocation.paladin' },
  { value: 3, key: 'vocation.sorcerer' },
  { value: 4, key: 'vocation.druid' },
  { value: 5, key: 'vocation.monk' },
  { value: 10, key: 'vocation.promoted' }
];

export function getVocationOptions(): VocationOption[] {
  return VOCATION_OPTION_KEYS.map(({ value, key }) => ({
    value,
    label: translate(key)
  }));
}

export function getVocationName(value?: number | null): string {
  if (value === null || value === undefined) return '';
  const opt = getVocationOptions().find(o => o.value === value);
  return opt ? opt.label : String(value);
}

export function getVocationOptionsHTML(
  selected?: number | null,
  includeEmpty = true,
  includeAny = true
): string {
  const options = getVocationOptions();
  const opts = includeAny ? options : options.filter(o => o.value !== -1);
  const emptyOpt = includeEmpty ? `<option value="">-- ${translate('select.placeholder')} --</option>` : '';
  const optionsHTML = opts
    .map(o => `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label}</option>`)
    .join('');
  return emptyOpt + optionsHTML;
}

export function getVocationMultiOptionsHTML(
  selectedValues?: number[] | null,
  includeAny = true
): string {
  const options = getVocationOptions();
  const opts = includeAny ? options : options.filter(o => o.value !== -1);
  const selectedSet = new Set(selectedValues || []);
  return opts
    .map(o => `<option value="${o.value}" ${selectedSet.has(o.value) ? 'selected' : ''}>${o.label}</option>`)
    .join('');
}

// Helper para normalização de chaves de flags (snake_case/camelCase/no-underscore)
export function getFlagBool(flags: CompleteFlags | undefined, key: string): boolean {
  if (!flags) return false;
  const anyFlags: Record<string, unknown> = flags as any;

  // 1) Tentativa direta
  const direct = anyFlags[key];
  if (typeof direct === 'boolean') return !!direct;

  // 2) CamelCase -> snake_case
  const snake = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  const snakeVal = anyFlags[snake];
  if (typeof snakeVal === 'boolean') return !!snakeVal;

  // 3) Normalização sem underscores/espacos
  const normalized = key.toLowerCase().replace(/[_\s]/g, '');
  for (const k of Object.keys(anyFlags)) {
    if (k.replace(/[_\s]/g, '').toLowerCase() === normalized) {
      const v = anyFlags[k];
      if (typeof v === 'boolean') return !!v;
    }
  }

  return false;
}

// Utility functions for UI
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function showStatus(message: string, type: 'loading' | 'success' | 'error' | 'warning' | 'info'): void {
  const statusMessage = document.querySelector('#status-message') as HTMLElement | null;
  if (!statusMessage) return;

  // Use the toast styles defined in CSS
  statusMessage.textContent = message;
  statusMessage.className = `status-toast ${type}`;
  statusMessage.style.display = 'block';
  statusMessage.classList.add('show');

  // Auto-hide non-loading messages after 5s
  if (type !== 'loading') {
    setTimeout(() => {
      statusMessage?.classList.remove('show');
      if (statusMessage) statusMessage.style.display = 'none';
    }, 5000);
  }
}

// Category information helpers
export interface CategoryInfo {
  icon: string;
  title: string;
  description: string;
}

export function getCategoryInfo(category: string): CategoryInfo {
  const categories: Record<string, { icon: string; titleKey: TranslationKey; descriptionKey: TranslationKey }> = {
    Objects: {
      icon: '🎯',
      titleKey: 'category.objects',
      descriptionKey: 'category.description.objects'
    },
    Outfits: {
      icon: '👤',
      titleKey: 'category.outfits',
      descriptionKey: 'category.description.outfits'
    },
    Effects: {
      icon: '✨',
      titleKey: 'category.effects',
      descriptionKey: 'category.description.effects'
    },
    Missiles: {
      icon: '🏹',
      titleKey: 'category.missiles',
      descriptionKey: 'category.description.missiles'
    },
    Sounds: {
      icon: '🔊',
      titleKey: 'category.sounds',
      descriptionKey: 'category.description.sounds'
    }
  };

  const entry = categories[category];
  if (entry) {
    return {
      icon: entry.icon,
      title: translate(entry.titleKey),
      description: translate(entry.descriptionKey)
    };
  }

  return {
    icon: '📦',
    title: translate('category.unknown'),
    description: translate('category.description.unknown')
  };
}

// Progress update helper
export function updateProgress(percentage: number, text: string): void {
  const progressFill = document.getElementById('progress-fill');
  const loadingText = document.getElementById('loading-text');

  if (progressFill) progressFill.style.width = `${percentage}%`;
  if (loadingText) loadingText.textContent = text;
}
