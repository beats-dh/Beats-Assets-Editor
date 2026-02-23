<script lang="ts">
  import { npcState } from '../../../../stores/npcState.svelte';
  import { invoke } from '../../../../utils/invoke';
  import { COMMANDS } from '../../../../commands';
  import { open } from '@tauri-apps/plugin-dialog';
  import type { SyncNpcShopsResult } from '../../../../npcTypes';

  interface Props { isOpen: boolean; }
  let { isOpen = $bindable(false) }: Props = $props();

  const DEFAULT_ITEMS_XML_PATH = 'data\\items\\items.xml';

  let ignoreIds = $state('');
  let ignoreNames = $state('');
  let keepCustomItems = $state(true);
  let itemsXmlPath = $state(DEFAULT_ITEMS_XML_PATH);
  let isSyncing = $state(false);
  let result = $state<SyncNpcShopsResult | null>(null);
  let error = $state('');

  function reset() {
    result = null;
    error = '';
  }

  function close() {
    isOpen = false;
    reset();
  }

  function useDefaultItemsXmlPath() {
    itemsXmlPath = DEFAULT_ITEMS_XML_PATH;
  }

  async function selectItemsXml() {
    try {
      const selection = await open({
        multiple: false,
        filters: [{ name: 'XML', extensions: ['xml'] }],
      });
      if (typeof selection === 'string' && selection) {
        itemsXmlPath = selection;
      }
    } catch (e) {
      console.error('Failed to select items.xml:', e);
    }
  }

  async function handleSync() {
    if (!npcState.npcsRootPath) {
      error = 'No NPC directory selected.';
      return;
    }

    isSyncing = true;
    error = '';
    result = null;

    try {
      const ignoreItemIds = ignoreIds
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));

      const ignoreItemNames = ignoreNames
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      result = await invoke<SyncNpcShopsResult>(
        COMMANDS.SYNC_NPC_SHOPS_FROM_PROTO,
        {
          npcsPath: npcState.npcsRootPath,
          ignoreItemIds,
          ignoreItemNames,
          keepCustomItems,
          itemsXmlPath: itemsXmlPath.trim() || null,
        }
      );

      window.dispatchEvent(new CustomEvent('reload-npc-list'));
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      isSyncing = false;
    }
  }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="monster-modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) close(); }}>
  <div class="monster-modal" style="max-width: 650px;">
    <div class="monster-modal-header">
      <h3>Sync Shop from Proto</h3>
      <button class="modal-close-button" onclick={close}>&times;</button>
    </div>

    <div class="monster-modal-body">
      <div class="monster-modal-section">
        <p style="color: var(--text-secondary); margin-bottom: 12px;">
          Updates all NPC shop inventories based on the <code>npcsaledata</code> flags in the loaded appearances proto file.
        </p>

        <div class="monster-modal-field" style="margin-bottom: 12px;">
          <label for="sync-items-xml-path">items.xml (name fallback for items without name in proto)</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input id="sync-items-xml-path" type="text" bind:value={itemsXmlPath} placeholder="Path to items.xml" disabled={isSyncing} style="flex: 1;" />
            <button class="btn-secondary" onclick={useDefaultItemsXmlPath} disabled={isSyncing} style="white-space: nowrap;">Default</button>
            <button class="btn-secondary" onclick={selectItemsXml} disabled={isSyncing} style="white-space: nowrap;">Browse</button>
          </div>
          <small style="color: var(--text-secondary);">
            Default: <code>data/items/items.xml</code>. Accepts relative or absolute path and is used to resolve item names not present in the proto.
          </small>
        </div>

        <div class="monster-modal-field" style="margin-bottom: 12px;">
          <label for="sync-ignore-item-ids">Ignore Item IDs (comma-separated)</label>
          <input id="sync-ignore-item-ids" type="text" bind:value={ignoreIds} placeholder="e.g. 100, 200, 300" disabled={isSyncing} />
          <small style="color: var(--text-secondary);">Items with these client IDs will not be synced from proto.</small>
        </div>

        <div class="monster-modal-field" style="margin-bottom: 12px;">
          <label for="sync-ignore-item-names">Ignore Item Names (comma-separated)</label>
          <input id="sync-ignore-item-names" type="text" bind:value={ignoreNames} placeholder="e.g. sword, magic plate armor" disabled={isSyncing} />
          <small style="color: var(--text-secondary);">Items with these names will not be synced from proto.</small>
        </div>

        <div class="monster-modal-field" style="margin-bottom: 16px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" bind:checked={keepCustomItems} disabled={isSyncing} />
            Keep custom items (items not in proto)
          </label>
          <small style="color: var(--text-secondary);">
            When enabled, existing shop items that are not found in proto will be preserved.
            When disabled, NPC shops are completely cleared and rewritten from proto only.
          </small>
        </div>
      </div>

      {#if error}
        <div class="monster-modal-section" style="color: var(--danger-color); margin-top: 8px;">
          {error}
        </div>
      {/if}

      {#if result}
        <div class="monster-modal-section" style="margin-top: 8px;">
          <h4>Result</h4>
          <div class="modal-grid" style="grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <div><strong>NPCs scanned:</strong> {result.totalNpcsScanned}</div>
            <div><strong>NPCs updated:</strong> {result.npcsUpdated}</div>
            <div><strong>NPCs skipped:</strong> {result.npcsSkipped}</div>
            <div><strong>Items added:</strong> {result.itemsAdded}</div>
            <div><strong>Items removed:</strong> {result.itemsRemoved}</div>
          </div>

          {#if result.errors.length > 0}
            <div style="margin-top: 8px;">
              <strong style="color: var(--danger-color);">Errors ({result.errors.length}):</strong>
              <div class="modal-list" style="max-height: 120px; overflow-y: auto; margin-top: 4px;">
                {#each result.errors as err}
                  <div style="color: var(--danger-color); font-size: 0.85em; padding: 2px 0;">{err}</div>
                {/each}
              </div>
            </div>
          {/if}

          {#if result.npcDetails.length > 0}
            <div style="margin-top: 8px;">
              <strong>Updated NPCs:</strong>
              <div class="modal-list" style="max-height: 150px; overflow-y: auto; margin-top: 4px;">
                {#each result.npcDetails as detail}
                  <div style="font-size: 0.85em; padding: 2px 0;">
                    <strong>{detail.npcName}</strong> - {detail.itemsBefore} items -> {detail.itemsAfter} items
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="monster-modal-footer">
      <button class="btn-secondary" onclick={close}>
        {result ? 'Close' : 'Cancel'}
      </button>
      {#if !result}
        <button class="btn-primary" onclick={handleSync} disabled={isSyncing}>
          {isSyncing ? 'Syncing...' : 'Sync All NPCs'}
        </button>
      {/if}
    </div>
  </div>
</div>
{/if}
