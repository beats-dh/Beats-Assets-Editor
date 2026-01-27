import { writable } from 'svelte/store';
import type { Monster, MonsterListEntry } from '../monsterTypes';

export const currentMonster = writable<Monster | null>(null);
export const currentFilePath = writable<string | null>(null);
export const monsterList = writable<MonsterListEntry[]>([]);
export const monstersRootPath = writable<string | null>(null);
export const isLoading = writable<boolean>(false);
export const monsterSearchQuery = writable<string>('');
export const expandedCategories = writable<Set<string>>(new Set(['__root__']));

// Bestiary class order - likely loaded from backend, defaulting to empty for now
export const bestiaryClassOrder = writable<string[]>([]);

// Derived store for filtered monsters could go here if needed, 
// but might be better handled in the component to avoid complex derived logic here for now.
