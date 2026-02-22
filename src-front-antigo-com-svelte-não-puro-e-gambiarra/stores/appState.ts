import { writable } from 'svelte/store';

export type AppView = 'launcher' | 'assets-editor' | 'monster-editor' | 'npc-editor';

export const currentView = writable<AppView>('launcher');
export const tibiaPath = writable<string>(localStorage.getItem('lastTibiaPath') || '');
export const monsterPath = writable<string>(localStorage.getItem('lastMonsterPath') || '');
export const npcPath = writable<string>(localStorage.getItem('lastNpcPath') || '');

// Persist tibiaPath to localStorage
tibiaPath.subscribe(value => {
  if (value) {
    localStorage.setItem('lastTibiaPath', value);
  } else {
    localStorage.removeItem('lastTibiaPath');
  }
});

// Persist monsterPath to localStorage
monsterPath.subscribe(value => {
  if (value) {
    localStorage.setItem('lastMonsterPath', value);
  } else {
    localStorage.removeItem('lastMonsterPath');
  }
});

// Persist npcPath to localStorage
npcPath.subscribe(value => {
  if (value) {
    localStorage.setItem('lastNpcPath', value);
  } else {
    localStorage.removeItem('lastNpcPath');
  }
});
