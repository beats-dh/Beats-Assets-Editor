import type { CompleteFlags, VocationOption } from './types';

// VOCATION enum helpers para UI
export const VOCATION_OPTIONS: VocationOption[] = [
  { value: -1, label: 'Any' },
  { value: 0, label: 'None' },
  { value: 1, label: 'Knight' },
  { value: 2, label: 'Paladin' },
  { value: 3, label: 'Sorcerer' },
  { value: 4, label: 'Druid' },
  { value: 5, label: 'Monk' },
  { value: 10, label: 'Promoted' },
];

export function getVocationName(value?: number | null): string {
  if (value === null || value === undefined) return '';
  const opt = VOCATION_OPTIONS.find(o => o.value === value);
  return opt ? opt.label : String(value);
}

export function getVocationOptionsHTML(
  selected?: number | null,
  includeEmpty = true,
  includeAny = true
): string {
  const opts = includeAny ? VOCATION_OPTIONS : VOCATION_OPTIONS.filter(o => o.value !== -1);
  const emptyOpt = includeEmpty ? `<option value="">-- Selecione --</option>` : '';
  const optionsHTML = opts
    .map(o => `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label}</option>`)
    .join('');
  return emptyOpt + optionsHTML;
}

export function getVocationMultiOptionsHTML(
  selectedValues?: number[] | null,
  includeAny = true
): string {
  const opts = includeAny ? VOCATION_OPTIONS : VOCATION_OPTIONS.filter(o => o.value !== -1);
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

export function showStatus(message: string, type: 'loading' | 'success' | 'error'): void {
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
  const categories: Record<string, CategoryInfo> = {
    'Objects': {
      icon: '🎯',
      title: 'Objects',
      description: 'Items, decorações e objetos do jogo'
    },
    'Outfits': {
      icon: '👤',
      title: 'Outfits',
      description: 'Roupas e aparências de personagens'
    },
    'Effects': {
      icon: '✨',
      title: 'Effects',
      description: 'Efeitos visuais e animações'
    },
    'Missiles': {
      icon: '🏹',
      title: 'Missiles',
      description: 'Projéteis e mísseis'
    }
  };

  return categories[category] || { icon: '📦', title: 'Unknown', description: 'Categoria desconhecida' };
}

// Progress update helper
export function updateProgress(percentage: number, text: string): void {
  const progressFill = document.getElementById('progress-fill');
  const loadingText = document.getElementById('loading-text');

  if (progressFill) progressFill.style.width = `${percentage}%`;
  if (loadingText) loadingText.textContent = text;
}
