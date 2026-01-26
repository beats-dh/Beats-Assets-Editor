import { writable } from 'svelte/store';

export type AppView = 'launcher' | 'assets-editor' | 'monster-editor' | 'npc-editor';

export const currentView = writable<AppView>('launcher');
export const tibiaPath = writable<string>(localStorage.getItem('lastTibiaPath') || '');

tibiaPath.subscribe(value => {
  if (value) {
    localStorage.setItem('lastTibiaPath', value);
  } else {
    localStorage.removeItem('lastTibiaPath');
  }
});
