# Svelte 5 + TypeScript — Frontend Templates

> Svelte 5 **runes** + TypeScript. No `writable`/`derived` JS stores, no
> `export let`, no `on:click`, no JSDoc-as-types.

## Type-safe invoke wrapper (Tauri 2 `core`)

```ts
// src/utils/invoke.ts
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type { CommandName } from '../commands';

// LiteralUnion: keeps autocomplete for known commands, still accepts any string.
export async function invoke<T = unknown>(
  command: CommandName | (string & {}),
  args?: Record<string, unknown>,
): Promise<T> {
  return tauriInvoke<T>(command, args);
}
```

```ts
// src/commands.ts — single source of truth for command names
export type CommandName =
  | 'get_settings'
  | 'update_settings'
  | 'process_batch';
// (or a COMMANDS const object of name -> string)
```

## Reactive store with runes (`*.svelte.ts`)

```ts
// src/stores/settingsState.svelte.ts
export interface Settings { theme: 'dark' | 'light'; language: string; autoSave: boolean }

export const settingsState = $state<Settings>({
  theme: 'dark',
  language: 'pt-BR',
  autoSave: true,
});
```

Load/save against the backend (plain async functions, not store methods):

```ts
// src/services/settingsService.ts
import { invoke } from '../utils/invoke';
import { settingsState, type Settings } from '../stores/settingsState.svelte';

export async function loadSettings(): Promise<void> {
  const s = await invoke<Settings>('get_settings');
  Object.assign(settingsState, s);
}

export async function saveSettings(): Promise<void> {
  await invoke('update_settings', { new: { ...settingsState } });
}
```

Components read/mutate `settingsState.theme` directly — reactivity is automatic.

## Component (Svelte 5 runes + event listener with cleanup)

```svelte
<!-- src/lib/components/FileProcessor.svelte -->
<script lang="ts">
  import { invoke } from '../../utils/invoke';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';

  let { files = [] }: { files?: string[] } = $props();

  let processing = $state(false);
  let progress = $state({ current: 0, total: 0, message: '' });
  let error = $state<string | null>(null);

  const percent = $derived(progress.total > 0 ? (progress.current / progress.total) * 100 : 0);

  // Subscribe on mount, unsubscribe on destroy (return = cleanup).
  $effect(() => {
    let unlisten: UnlistenFn | undefined;
    listen<typeof progress>('batch-progress', (e) => { progress = e.payload; })
      .then((u) => { unlisten = u; });
    return () => unlisten?.();
  });

  async function process(): Promise<void> {
    processing = true;
    error = null;
    try {
      await invoke('process_batch', { items: files });
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      processing = false;
    }
  }
</script>

<button onclick={process} disabled={processing || files.length === 0}>
  {processing ? 'Processing…' : 'Start'}
</button>

{#if processing}
  <div class="bar" style="width:{percent}%"></div>
{/if}
{#if error}
  <p class="error">{error}</p>
{/if}
```

## File dialogs (Tauri 2 plugin)

```ts
import { open, save } from '@tauri-apps/plugin-dialog';

const picked = await open({
  multiple: true,
  filters: [{ name: 'Lua', extensions: ['lua'] }],
});
const dest = await save({ defaultPath: 'out.dat' });
```

## DOM / lint conventions (SonarCloud-clean)

- `globalThis` over `window`/`self`; `Number.parseInt`/`Number.isNaN`.
- `??` / `??=` over `||`-as-default and equivalent ternaries.
- `element.dataset.foo` over `getAttribute('data-foo')`.
- `textContent`/`createElement` over `innerHTML` (XSS-safe; CodeQL flags innerHTML).

Type-check: `npx tsc --noEmit`.
