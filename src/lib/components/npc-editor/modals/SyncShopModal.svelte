<script lang="ts">
  import { npcState } from '../../../../stores/npcState.svelte';
  import { invoke } from '../../../../utils/invoke';
  import { COMMANDS } from '../../../../commands';
  import { open } from '@tauri-apps/plugin-dialog';
  import type { SyncNpcShopsResult } from '../../../../npcTypes';

  interface Props { isOpen: boolean; }
  let { isOpen = $bindable(false) }: Props = $props();

  const DEFAULT_ITEMS_XML_PATH = 'data\\items\\items.xml';
  const FANDOM_API_URL = 'https://tibia.fandom.com/api.php';

  let ignoreIds = $state('');
  let ignoreNames = $state('');
  let keepCustomItems = $state(true);
  let itemsXmlPath = $state(DEFAULT_ITEMS_XML_PATH);
  let shopSource = $state<'proto' | 'fandom'>('proto');
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

  type FandomExternalEntry = {
    itemName: string;
    itemId?: number;
    salePrice?: number;
    buyPrice?: number;
    marketCategory?: number;
  };

  type FandomCategoryResponse = {
    continue?: { cmcontinue?: string };
    query?: { categorymembers?: Array<{ title: string }> };
    error?: { info?: string };
  };

  type FandomParseResponse = {
    parse?: { text?: string };
    error?: { info?: string };
  };

  type FandomBuildResult = {
    shopMap: Record<string, FandomExternalEntry[]>;
    missingNpcNames: string[];
  };

  function normalizeLookupKey(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function parseGoldPrice(priceCell: Element): number | null {
    const rawText = (priceCell.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!rawText) return null;

    const hasCoinIndicator = Array.from(priceCell.querySelectorAll('img')).some((img) => {
      const probe = `${img.getAttribute('alt') ?? ''} ${img.getAttribute('title') ?? ''} ${img.getAttribute('src') ?? ''}`;
      return /(gold|coin|gp)/i.test(probe);
    });
    const hasLinkedItemCurrency = priceCell.querySelector('a') !== null;
    const hasExplicitGoldText = /(gold|coin|coins|gp|gps)/i.test(rawText);

    // Ignore barter-like prices such as "1 Red Lantern".
    if (hasLinkedItemCurrency && !hasCoinIndicator && !hasExplicitGoldText) {
      return null;
    }
    if (/[a-z]/i.test(rawText) && !hasCoinIndicator && !hasExplicitGoldText) {
      return null;
    }

    const match = rawText.replace(/,/g, '').match(/\d+/);
    if (!match) return null;
    const parsed = Number.parseInt(match[0], 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parseTradeRowsFromSection(renderedHtml: string, sectionId: 'Buys' | 'Sells'): Array<{ itemName: string; price: number | null }> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(renderedHtml, 'text/html');
    const headline = doc.querySelector(`span.mw-headline#${sectionId}`);
    const heading = headline?.closest('h2,h3,h4');
    if (!heading) return [];

    let table: HTMLTableElement | null = null;
    let cursor: Element | null = heading.nextElementSibling;
    while (cursor) {
      const tag = cursor.tagName.toLowerCase();
      if (tag === 'table') {
        table = cursor as HTMLTableElement;
        break;
      }
      if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
        break;
      }
      cursor = cursor.nextElementSibling;
    }

    if (!table) return [];

    const headerRow = table.querySelector('tr');
    if (!headerRow) return [];

    const headers = Array.from(headerRow.querySelectorAll('th')).map((th) =>
      (th.textContent ?? '').trim().toLowerCase()
    );
    const itemIdx = headers.findIndex((header) => header.includes('item'));
    const priceIdx = headers.findIndex((header) => header.includes('price'));
    if (itemIdx < 0 || priceIdx < 0) return [];

    const rows: Array<{ itemName: string; price: number | null }> = [];
    for (const row of Array.from(table.querySelectorAll('tr')).slice(1)) {
      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length <= itemIdx || cells.length <= priceIdx) continue;

      const itemCell = cells[itemIdx];
      const itemLink = itemCell.querySelector('a');
      const itemName = (itemLink?.textContent ?? itemCell.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!itemName) continue;

      const price = parseGoldPrice(cells[priceIdx]);

      rows.push({ itemName, price });
    }

    return rows;
  }

  async function fetchFandomCategoryTitles(): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    let cmcontinue: string | undefined = undefined;

    while (true) {
      const params = new URLSearchParams({
        action: 'query',
        list: 'categorymembers',
        cmtitle: 'Category:NPCs',
        cmtype: 'page',
        cmlimit: '500',
        format: 'json',
        formatversion: '2',
        origin: '*',
      });
      if (cmcontinue) params.set('cmcontinue', cmcontinue);

      const response = await fetch(`${FANDOM_API_URL}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch Fandom category list (${response.status})`);
      }

      const data = (await response.json()) as FandomCategoryResponse;
      if (data.error?.info) {
        throw new Error(data.error.info);
      }

      for (const member of data.query?.categorymembers ?? []) {
        const key = member.title.trim().toLowerCase();
        if (key) result.set(key, member.title);
      }

      cmcontinue = data.continue?.cmcontinue;
      if (!cmcontinue) break;
    }

    return result;
  }

  async function fetchFandomNpcRenderedHtml(pageTitle: string): Promise<string> {
    const params = new URLSearchParams({
      action: 'parse',
      page: pageTitle,
      prop: 'text',
      format: 'json',
      formatversion: '2',
      origin: '*',
    });

    const response = await fetch(`${FANDOM_API_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Fandom page '${pageTitle}' (${response.status})`);
    }

    const data = (await response.json()) as FandomParseResponse;
    if (data.error?.info) {
      throw new Error(data.error.info);
    }

    const html = data.parse?.text;
    if (!html) {
      throw new Error(`Page '${pageTitle}' has no parsed trade content`);
    }
    return html;
  }

  async function runWithConcurrency<T>(
    items: T[],
    limit: number,
    worker: (item: T) => Promise<void>
  ): Promise<void> {
    if (items.length === 0) return;

    let cursor = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (true) {
        const index = cursor++;
        if (index >= items.length) break;
        await worker(items[index]);
      }
    });

    await Promise.all(workers);
  }

  async function buildFandomShopMap(npcNames: string[]): Promise<FandomBuildResult> {
    const categoryTitles = await fetchFandomCategoryTitles();
    const normalizedCategoryTitles = new Map<string, string>();
    for (const [key, title] of categoryTitles) {
      const normalized = normalizeLookupKey(key);
      if (normalized && !normalizedCategoryTitles.has(normalized)) {
        normalizedCategoryTitles.set(normalized, title);
      }
    }

    const uniqueNpcNames = Array.from(
      new Set(npcNames.map((name) => name.trim()).filter((name) => name.length > 0))
    );

    const fandomMap: Record<string, FandomExternalEntry[]> = {};
    const missingNpcNames: string[] = [];

    await runWithConcurrency(uniqueNpcNames, 6, async (npcName) => {
      const title =
        categoryTitles.get(npcName.toLowerCase()) ??
        normalizedCategoryTitles.get(normalizeLookupKey(npcName));
      if (!title) {
        missingNpcNames.push(npcName);
        return;
      }

      let html: string;
      try {
        html = await fetchFandomNpcRenderedHtml(title);
      } catch (err) {
        console.warn(`Fandom fetch failed for ${npcName}:`, err);
        return;
      }

      const buys = parseTradeRowsFromSection(html, 'Buys');
      const sells = parseTradeRowsFromSection(html, 'Sells');
      if (buys.length === 0 && sells.length === 0) return;

      const merged = new Map<string, FandomExternalEntry>();
      for (const row of buys) {
        const key = row.itemName.toLowerCase();
        const entry = merged.get(key) ?? { itemName: row.itemName };
        if (row.price !== null) {
          entry.buyPrice = row.price;
        }
        merged.set(key, entry);
      }
      for (const row of sells) {
        const key = row.itemName.toLowerCase();
        const entry = merged.get(key) ?? { itemName: row.itemName };
        if (row.price !== null) {
          entry.salePrice = row.price;
        }
        merged.set(key, entry);
      }

      const items = Array.from(merged.values()).sort((a, b) =>
        a.itemName.localeCompare(b.itemName)
      );
      if (items.length > 0) {
        fandomMap[npcName.toLowerCase()] = items;
      }
    });

    return {
      shopMap: fandomMap,
      missingNpcNames,
    };
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

      let fandomShopMap: Record<string, FandomExternalEntry[]> | null = null;
      let missingFandomNpcNames: string[] = [];

      if (shopSource === 'fandom') {
        const npcEntries = npcState.npcList;
        const npcNames = npcEntries.map((entry) => entry.name).filter((name) => name.trim().length > 0);
        if (npcNames.length === 0) {
          throw new Error('No NPC list loaded. Load NPC files first to map Fandom data.');
        }

        const fandomBuild = await buildFandomShopMap(npcNames);
        fandomShopMap = fandomBuild.shopMap;
        missingFandomNpcNames = fandomBuild.missingNpcNames;

        if (Object.keys(fandomShopMap).length === 0) {
          throw new Error(
            'No shop data found on Fandom for the loaded NPC list.'
          );
        }
      }

      const syncResult = await invoke<SyncNpcShopsResult>(
        COMMANDS.SYNC_NPC_SHOPS_FROM_PROTO,
        {
          npcsPath: npcState.npcsRootPath,
          ignoreItemIds,
          ignoreItemNames,
          keepCustomItems,
          itemsXmlPath: itemsXmlPath.trim() || null,
          shopSource,
          fandomShopMap,
        }
      );

      if (shopSource === 'fandom' && missingFandomNpcNames.length > 0) {
        const preview = missingFandomNpcNames.slice(0, 15).join(', ');
        const remaining = missingFandomNpcNames.length - Math.min(15, missingFandomNpcNames.length);
        const suffix = remaining > 0 ? ` (+${remaining} more)` : '';
        syncResult.errors = [
          `Fandom: ${missingFandomNpcNames.length} NPC(s) were not matched in Category:NPCs (${preview}${suffix}).`,
          ...syncResult.errors,
        ];
      }

      result = syncResult;
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
      <h3>Sync NPC Shops</h3>
      <button class="modal-close-button" onclick={close}>&times;</button>
    </div>

    <div class="monster-modal-body">
      <div class="monster-modal-section">
        <p style="color: var(--text-secondary); margin-bottom: 12px;">
          Updates NPC shop inventories from <code>Proto</code> or <code>Fandom</code> source.
        </p>

        <div class="monster-modal-field" style="margin-bottom: 12px;">
          <label for="sync-shop-source">Source</label>
          <select id="sync-shop-source" bind:value={shopSource} disabled={isSyncing}>
            <option value="proto">Proto (loaded appearances)</option>
            <option value="fandom">Fandom (Category:NPCs)</option>
          </select>
          <small style="color: var(--text-secondary);">
            {#if shopSource === 'proto'}Uses <code>npcsaledata</code> from the loaded appearances file.{:else}Uses <code>https://tibia.fandom.com/wiki/Category:NPCs</code> and each NPC trade table.{/if}
          </small>
        </div>

        <div class="monster-modal-field" style="margin-bottom: 12px;">
          <label for="sync-items-xml-path">
            {shopSource === 'proto'
              ? 'items.xml (name fallback for items without name in proto)'
              : 'items.xml (maps Fandom item names to clientId)'}
          </label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input id="sync-items-xml-path" type="text" bind:value={itemsXmlPath} placeholder="Path to items.xml" disabled={isSyncing} style="flex: 1;" />
            <button class="btn-secondary" onclick={useDefaultItemsXmlPath} disabled={isSyncing} style="white-space: nowrap;">Default</button>
            <button class="btn-secondary" onclick={selectItemsXml} disabled={isSyncing} style="white-space: nowrap;">Browse</button>
          </div>
          <small style="color: var(--text-secondary);">
            Default: <code>data/items/items.xml</code>. Accepts relative or absolute path.
          </small>
        </div>

        <div class="monster-modal-field" style="margin-bottom: 12px;">
          <label for="sync-ignore-item-ids">Ignore Item IDs (comma-separated)</label>
          <input id="sync-ignore-item-ids" type="text" bind:value={ignoreIds} placeholder="e.g. 100, 200, 300" disabled={isSyncing} />
          <small style="color: var(--text-secondary);">Items with these client IDs will not be synced from the selected source.</small>
        </div>

        <div class="monster-modal-field" style="margin-bottom: 12px;">
          <label for="sync-ignore-item-names">Ignore Item Names (comma-separated)</label>
          <input id="sync-ignore-item-names" type="text" bind:value={ignoreNames} placeholder="e.g. sword, magic plate armor" disabled={isSyncing} />
          <small style="color: var(--text-secondary);">Items with these names will not be synced from the selected source.</small>
        </div>

        <div class="monster-modal-field" style="margin-bottom: 16px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" bind:checked={keepCustomItems} disabled={isSyncing} />
            Keep custom items (items not in source)
          </label>
          <small style="color: var(--text-secondary);">
            When enabled, existing shop items that are not found in the selected source are preserved.
            When disabled, NPC shops are rewritten using only the selected source.
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
