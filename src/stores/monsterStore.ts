import { writable } from 'svelte/store';
import type { Monster, MonsterListEntry } from '../monsterTypes';

export const currentMonster = writable<Monster | null>(null);
export const currentFilePath = writable<string | null>(null);
export const monsterList = writable<MonsterListEntry[]>([]);
export const monstersRootPath = writable<string | null>(null);
export const isLoading = writable<boolean>(false);
export const monsterSearchQuery = writable<string>('');
export const expandedCategories = writable<Set<string>>(new Set(['__root__']));

// Bestiary class order - loaded from backend
export const bestiaryClassOrder = writable<string[]>([]);

// Cache control - tracks the path that was last successfully loaded
// If this matches monstersRootPath, we don't need to reload
export const cachedMonstersPath = writable<string | null>(null);
