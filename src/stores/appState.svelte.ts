// Application-level state using Svelte 5 runes
export type AppView = 'launcher' | 'assets-editor' | 'monster-editor' | 'npc-editor' | 'proficiency-editor';

// Reactive state with localStorage persistence
function createAppState() {
    const state = $state({
        currentView: 'launcher' as AppView,
        tibiaPath: localStorage.getItem('lastTibiaPath') || '',
        monsterPath: localStorage.getItem('lastMonsterPath') || '',
        npcPath: localStorage.getItem('lastNpcPath') || '',
        proficiencyFilePath: localStorage.getItem('lastProficiencyFilePath') || '',
    });

    // Persist paths to localStorage reactively
    $effect.root(() => {
        $effect(() => {
            if (state.tibiaPath) {
                localStorage.setItem('lastTibiaPath', state.tibiaPath);
            } else {
                localStorage.removeItem('lastTibiaPath');
            }
        });
        $effect(() => {
            if (state.monsterPath) {
                localStorage.setItem('lastMonsterPath', state.monsterPath);
            } else {
                localStorage.removeItem('lastMonsterPath');
            }
        });
        $effect(() => {
            if (state.npcPath) {
                localStorage.setItem('lastNpcPath', state.npcPath);
            } else {
                localStorage.removeItem('lastNpcPath');
            }
        });
        $effect(() => {
            if (state.proficiencyFilePath) {
                localStorage.setItem('lastProficiencyFilePath', state.proficiencyFilePath);
            } else {
                localStorage.removeItem('lastProficiencyFilePath');
            }
        });
    });

    return state;
}

export const appState = createAppState();
