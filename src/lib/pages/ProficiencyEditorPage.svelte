<script lang="ts">
  import { open, save } from '@tauri-apps/plugin-dialog';
  import { appState } from '../../stores/appState.svelte';
  import { invoke } from '../../utils/invoke';
  import { COMMANDS } from '../../commands';
  import { showStatus } from '../../utils';
  import type { ProficiencyEntry, ProficiencyLevel, ProficiencyPerk, RawFileInfo } from '../../types';

  // ── Asset helpers ──────────────────────────────────────────────────────────
  const ICON_BASE = '../../assets/rcc_extracted/minimap/images/proficiency/';

  function asset(name: string) {
    return new URL(`${ICON_BASE}${name}`, import.meta.url).href;
  }

  const PERK_TYPE_LABELS: Record<number, string> = {
    0: 'Desbloqueio',
    3: 'Bônus de Skill',
    5: 'Bônus de Spell',
    7: 'Chance Crítico Elem.',
    8: 'Dano Crítico Elem.',
    12: 'Dano vs Bestiário',
    15: 'Dano Extra Auto-Ataque',
    16: 'Dano Extra Spells',
    17: 'Cura Extra Spells',
    25: 'Piercing Elemental',
    26: 'Bônus Skill Ofensivo',
    27: 'Magic Level Especializado',
  };

  const PERK_TYPE_ICONS: Record<number, string> = {
    3:  'icons-weaponmastery-offensiveBonusSkill.png',
    5:  'icons-weaponmastery-gainExtraDamageSpells.png',
    7:  'icons-weaponmastery-criticalHitChanceElement.png',
    8:  'icons-weaponmastery-criticalExtraDamageElement.png',
    12: 'icons-weaponmastery-damagaAgainstBestiary.png',
    15: 'icons-weaponmastery-gainExtraDamageAutoAttack.png',
    16: 'icons-weaponmastery-gainExtraDamageSpells.png',
    17: 'icons-weaponmastery-gainExtraHealingSpells.png',
    25: 'icons-weaponmastery-elementalPiercing.png',
    26: 'icons-weaponmastery-offensiveBonusSkill.png',
    27: 'icon-weaponsmastery-specializedMagicLevel.png',
  };

  function getPerkLabel(type: number) {
    return PERK_TYPE_LABELS[type] ?? `Type ${type}`;
  }

  function getPerkIconSrc(type: number) {
    return asset(PERK_TYPE_ICONS[type] ?? 'icons-weaponmastery.png');
  }

  function getMasteryIconSrc(level: number, gold = false) {
    const n = Math.min(Math.max(level, 0), 7);
    if (n === 0) return asset('icon-masterylevel-0.png');
    return asset(`icon-masterylevel-${n}${gold ? '-gold' : '-silver'}.png`);
  }

  const STAR_GOLD        = asset('icon-star-tiny-gold.png');
  const STAR_SILVER      = asset('icon-star-tiny-silver.png');
  const BORDER_ACTIVE    = asset('border-weaponmasterytreeicons-active.png');
  const BORDER_INACTIVE  = asset('border-weaponmasterytreeicons-inactive.png');
  const LOCK_ICON        = asset('icon-lock-grey.png');
  const LOCK_ICON_BIG    = asset('big-icon-lock-grey.png');
  const BG_GRID          = asset('full-bonus-select-bg.png');
  const BG_COL           = asset('bonus-select-bg.png');
  const AUGMENT_ICONS    = asset('augment-icons.png');

  // Augment icons sprite: 416×64, 2 rows, 32×32px each → 13 icons per row
  // Row 0 (y=0) = active colored, Row 1 (y=32) = inactive grey
  function getAugmentIconStyle(augmentType: number, active = true): string {
    const col = augmentType % 13;
    const row = active ? 0 : 1;
    const x = -(col * 32);
    const y = -(row * 32);
    return `background-image:url(${AUGMENT_ICONS});background-position:${x}px ${y}px;background-size:416px 64px;background-repeat:no-repeat;width:32px;height:32px;display:inline-block;image-rendering:pixelated`;
  }

  const MAX_ROWS = 5;

  // ── State ──────────────────────────────────────────────────────────────────
  let entries   = $state<ProficiencyEntry[]>([]);
  let filePath  = $state(appState.proficiencyFilePath || '');
  let selectedId = $state<number | null>(null);
  let isLoading = $state(false);
  let isDirty   = $state(false);
  let searchTerm = $state('');
  let showAddModal = $state(false);
  let newEntryName = $state('');
  let newEntryId   = $state(1);
  let rawInfo   = $state<RawFileInfo | null>(null);
  let loadError = $state('');

  // Selected cell: which column (level) and row (perk slot)
  let selLvl  = $state<number | null>(null);  // level index
  let selRow  = $state<number | null>(null);  // row index (= perk index)

  // ── Derived ────────────────────────────────────────────────────────────────
  let filtered = $derived(
    entries.filter(e =>
      e.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(e.ProficiencyId).includes(searchTerm)
    )
  );

  let selectedEntry = $derived(entries.find(e => e.ProficiencyId === selectedId) ?? null);
  let selectedIndex = $derived(entries.findIndex(e => e.ProficiencyId === selectedId));

  let selectedPerk = $derived(
    selLvl !== null && selRow !== null && selectedEntry !== null
      ? (selectedEntry.Levels[selLvl]?.Perks[selRow] ?? null)
      : null
  ) as ProficiencyPerk | null;

  // ── Load / Save ────────────────────────────────────────────────────────────
  async function loadFile(path?: string) {
    const target = path ?? filePath;
    if (!target) return;
    isLoading = true;
    loadError = '';
    rawInfo = null;
    try {
      const loaded = await invoke<ProficiencyEntry[]>(COMMANDS.LOAD_PROFICIENCY_FILE, { filePath: target });
      entries = loaded;
      filePath = target;
      appState.proficiencyFilePath = target;
      selectedId = loaded[0]?.ProficiencyId ?? null;
      isDirty = false;
      selLvl = null; selRow = null;
      showStatus(`Loaded ${loaded.length} entries`, 'success');
    } catch (e) {
      loadError = String(e);
      try { rawInfo = await invoke<RawFileInfo>(COMMANDS.INSPECT_PROFICIENCY_FILE, { filePath: target }); } catch { /* */ }
      showStatus('Unrecognised format', 'error');
    } finally {
      isLoading = false;
    }
  }

  async function openFilePicker() {
    const sel = await open({ directory: false, multiple: false, filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (typeof sel === 'string' && sel) await loadFile(sel);
  }

  async function saveFile() {
    if (!filePath) { await saveAs(); return; }
    try {
      await invoke(COMMANDS.SAVE_PROFICIENCY_FILE, { filePath, data: entries });
      isDirty = false;
      showStatus('Saved!', 'success');
    } catch (e) { showStatus(`Save error: ${e}`, 'error'); }
  }

  async function saveAs() {
    const target = await save({ defaultPath: 'proficiency.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (typeof target === 'string' && target) {
      filePath = target;
      appState.proficiencyFilePath = target;
      await saveFile();
    }
  }

  function markDirty() { isDirty = true; }

  // ── Entry mutations ────────────────────────────────────────────────────────
  function addEntry() {
    if (!newEntryName.trim()) return;
    if (entries.find(e => e.ProficiencyId === newEntryId)) {
      showStatus(`ID ${newEntryId} already exists`, 'error'); return;
    }
    const entry: ProficiencyEntry = {
      Name: newEntryName.trim(),
      ProficiencyId: newEntryId,
      Levels: Array.from({ length: 7 }, () => ({ Perks: [] })),
    };
    entries = [...entries, entry].sort((a, b) => a.ProficiencyId - b.ProficiencyId);
    selectedId = newEntryId;
    showAddModal = false;
    newEntryName = '';
    newEntryId = Math.max(...entries.map(e => e.ProficiencyId)) + 1;
    markDirty();
  }

  function deleteEntry(id: number) {
    entries = entries.filter(e => e.ProficiencyId !== id);
    if (selectedId === id) selectedId = entries[0]?.ProficiencyId ?? null;
    selLvl = null; selRow = null;
    markDirty();
  }

  function updateEntryField(idx: number, field: keyof ProficiencyEntry, value: any) {
    entries = entries.map((e, i) => i === idx ? { ...e, [field]: value } : e);
    markDirty();
  }

  function addLevel(entryIdx: number) {
    entries = entries.map((e, i) => i !== entryIdx ? e : { ...e, Levels: [...e.Levels, { Perks: [] }] });
    markDirty();
  }

  function removeLevel(entryIdx: number, lvlIdx: number) {
    entries = entries.map((e, i) => {
      if (i !== entryIdx) return e;
      return { ...e, Levels: e.Levels.filter((_, li) => li !== lvlIdx) };
    });
    if (selLvl === lvlIdx) { selLvl = null; selRow = null; }
    markDirty();
  }

  function updateLevelXp(entryIdx: number, lvlIdx: number, raw: string) {
    const xp = raw === '' ? undefined : parseInt(raw);
    entries = entries.map((e, i) => {
      if (i !== entryIdx) return e;
      const Levels = e.Levels.map((lv, li) => li === lvlIdx ? { ...lv, XpRequired: xp } : lv);
      return { ...e, Levels };
    });
    markDirty();
  }

  // ── Perk mutations ─────────────────────────────────────────────────────────
  function addPerkAt(entryIdx: number, lvlIdx: number, rowIdx: number) {
    entries = entries.map((e, i) => {
      if (i !== entryIdx) return e;
      const Levels = e.Levels.map((lv, li) => {
        if (li !== lvlIdx) return lv;
        const Perks = [...lv.Perks];
        // Insert at rowIdx (fill gaps with empty placeholder if needed? No — just append)
        Perks.splice(rowIdx, 0, { Type: 15, Value: 0.05 });
        return { ...lv, Perks };
      });
      return { ...e, Levels };
    });
    selLvl = lvlIdx; selRow = rowIdx;
    markDirty();
  }

  function updateSelPerk(field: keyof ProficiencyPerk, value: any) {
    if (selLvl === null || selRow === null || selectedIndex < 0) return;
    entries = entries.map((e, i) => {
      if (i !== selectedIndex) return e;
      const Levels = e.Levels.map((lv, li) => {
        if (li !== selLvl) return lv;
        const Perks = lv.Perks.map((p, pi) => pi === selRow ? { ...p, [field]: value } : p);
        return { ...lv, Perks };
      });
      return { ...e, Levels };
    });
    markDirty();
  }

  function updateSelPerkOptional(field: keyof ProficiencyPerk, raw: string) {
    updateSelPerk(field, raw === '' ? undefined : Number(raw));
  }

  function removeSelPerk() {
    if (selLvl === null || selRow === null || selectedIndex < 0) return;
    entries = entries.map((e, i) => {
      if (i !== selectedIndex) return e;
      const Levels = e.Levels.map((lv, li) => {
        if (li !== selLvl) return lv;
        return { ...lv, Perks: lv.Perks.filter((_, pi) => pi !== selRow) };
      });
      return { ...e, Levels };
    });
    selLvl = null; selRow = null;
    markDirty();
  }

  // Click a grid slot
  function clickSlot(lvlIdx: number, rowIdx: number, hasPerk: boolean) {
    if (selLvl === lvlIdx && selRow === rowIdx) {
      // deselect
      selLvl = null; selRow = null;
    } else if (hasPerk) {
      selLvl = lvlIdx; selRow = rowIdx;
    } else {
      // only allow adding if the row is directly after the last perk
      const entry = selectedEntry;
      if (!entry) return;
      const lv = entry.Levels[lvlIdx];
      if (rowIdx <= lv.Perks.length && lv.Perks.length < MAX_ROWS) {
        addPerkAt(selectedIndex, lvlIdx, rowIdx);
      }
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  $effect(() => {
    if (filePath && entries.length === 0 && !loadError) {
      loadFile(filePath);
    }
  });
</script>

<!-- ════════════════════════════════════ TEMPLATE ════════════════════════════════════ -->
<div class="pe">

  <!-- ── Top header bar ── -->
  <header class="pe-header">
    <button class="pe-btn pe-btn-back" onclick={() => appState.currentView = 'launcher'}>← Back</button>
    <div class="pe-header-title">
      <img src={getMasteryIconSrc(4, true)} alt="" class="pe-title-icon" />
      <span>Weapon Proficiency Editor</span>
      {#if isDirty}<span class="pe-dirty" title="Unsaved changes">●</span>{/if}
    </div>
    <div class="pe-header-actions">
      <button class="pe-btn" onclick={openFilePicker} disabled={isLoading}>📂 Open</button>
      <button class="pe-btn pe-btn-gold" onclick={saveFile} disabled={isLoading || !filePath}>💾 Save</button>
      <button class="pe-btn" onclick={saveAs} disabled={isLoading}>💾 Save As…</button>
    </div>
  </header>

  <!-- ── Error banner ── -->
  {#if loadError}
    <div class="pe-banner pe-banner-error">
      <strong>⚠ Format error:</strong> {loadError}
      {#if rawInfo}
        <span>Root type: <code>{rawInfo.topLevelType}</code></span>
        {#if rawInfo.arrayLength !== undefined}<span>· {rawInfo.arrayLength} items</span>{/if}
      {/if}
      <button class="pe-btn pe-btn-xs" onclick={() => { loadError = ''; rawInfo = null; }}>✕</button>
    </div>
  {/if}

  {#if !filePath && entries.length === 0 && !loadError}
    <!-- ── Empty state ── -->
    <div class="pe-empty">
      <img src={getMasteryIconSrc(5, true)} alt="" class="pe-empty-icon" />
      <h2>No file loaded</h2>
      <p>Open a <code>proficiencies-*.json</code> from the client assets folder.</p>
      <button class="pe-btn pe-btn-gold pe-btn-lg" onclick={openFilePicker}>📂 Open JSON file</button>
    </div>

  {:else if !loadError}
    <div class="pe-body">

      <!-- ── Left sidebar: weapon list ── -->
      <aside class="pe-sidebar">
        <div class="pe-sidebar-top">
          <input class="pe-search" type="text" placeholder="Search…" bind:value={searchTerm} />
          <button class="pe-btn pe-btn-gold pe-btn-xs" onclick={() => {
            showAddModal = true;
            newEntryId = entries.length ? Math.max(...entries.map(e => e.ProficiencyId)) + 1 : 1;
          }}>＋</button>
        </div>

        <div class="pe-weapon-list">
          {#each filtered as entry (entry.ProficiencyId)}
            <div
              class="pe-weapon-item"
              class:active={selectedId === entry.ProficiencyId}
              role="button" tabindex="0"
              onclick={() => { selectedId = entry.ProficiencyId; selLvl = null; selRow = null; }}
              onkeydown={(e) => e.key === 'Enter' && (selectedId = entry.ProficiencyId)}
            >
              <img
                class="pe-weapon-icon"
                src={getMasteryIconSrc(Math.min(entry.Levels.length, 7), selectedId === entry.ProficiencyId)}
                alt=""
              />
              <div class="pe-weapon-info">
                <span class="pe-weapon-name">{entry.Name}</span>
                <span class="pe-weapon-meta">ID {entry.ProficiencyId} · {entry.Levels.length} lvls</span>
              </div>
              <button
                class="pe-delete-btn"
                onclick={(ev) => { ev.stopPropagation(); deleteEntry(entry.ProficiencyId); }}
                title="Delete"
              >✕</button>
            </div>
          {/each}
          {#if filtered.length === 0}
            <div class="pe-list-empty">No results</div>
          {/if}
        </div>

        <div class="pe-sidebar-foot">{entries.length} proficiencies</div>
      </aside>

      <!-- ── Right: mastery panel ── -->
      <main class="pe-main">
        {#if selectedEntry !== null && selectedIndex >= 0}
          {@const entry = selectedEntry}
          {@const entryIdx = selectedIndex}

          <!-- Entry info bar -->
          <div class="pe-entry-bar">
            <label class="pe-field">
              <span class="pe-field-label">Name</span>
              <input class="pe-input pe-input-lg" type="text"
                value={entry.Name}
                oninput={(e) => updateEntryField(entryIdx, 'Name', (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="pe-field">
              <span class="pe-field-label">ID</span>
              <input class="pe-input pe-input-sm" type="number" min="1"
                value={entry.ProficiencyId}
                oninput={(e) => updateEntryField(entryIdx, 'ProficiencyId', parseInt((e.target as HTMLInputElement).value) || entry.ProficiencyId)}
              />
            </label>
            <label class="pe-field">
              <span class="pe-field-label">Version</span>
              <input class="pe-input pe-input-sm" type="number" min="0"
                value={entry.Version ?? ''}
                placeholder="—"
                oninput={(e) => updateEntryField(entryIdx, 'Version', (e.target as HTMLInputElement).value ? parseInt((e.target as HTMLInputElement).value) : undefined)}
              />
            </label>
            <button class="pe-btn pe-btn-xs" onclick={() => addLevel(entryIdx)} title="Add level">＋ Level</button>
          </div>

          <!-- ─ Mastery grid ─ -->
          <div class="pe-grid-wrap">
            <div class="pe-grid">

              <!-- Stars row -->
              <div class="pe-grid-row pe-stars-row">
                <div class="pe-row-label"></div>
                {#each entry.Levels as lv, li}
                  <div class="pe-star-cell">
                    {#each Array(li + 1) as _}
                      <img class="pe-star" src={lv.Perks.length > 0 ? STAR_GOLD : STAR_SILVER} alt="★" />
                    {/each}
                  </div>
                {/each}
              </div>

              <!-- Level header row -->
              <div class="pe-grid-row pe-header-row">
                <div class="pe-row-label"></div>
                {#each entry.Levels as lv, li}
                  {@const gold = lv.Perks.length > 0}
                  <div class="pe-level-cell" class:gold>
                    <img class="pe-mastery-icon" src={getMasteryIconSrc(li + 1, gold)} alt="lv {li + 1}" />
                    <span class="pe-level-num">Level {li + 1}</span>
                    <button
                      class="pe-remove-lvl"
                      onclick={() => removeLevel(entryIdx, li)}
                      title="Remove level"
                    >✕</button>
                  </div>
                {/each}
              </div>

              <!-- XP row -->
              <div class="pe-grid-row pe-xp-row">
                <div class="pe-row-label pe-row-label-text">XP</div>
                {#each entry.Levels as lv, li}
                  <div class="pe-xp-cell">
                    <input
                      class="pe-xp-input"
                      type="number" min="0"
                      value={lv.XpRequired ?? ''}
                      placeholder="—"
                      oninput={(e) => updateLevelXp(entryIdx, li, (e.target as HTMLInputElement).value)}
                    />
                  </div>
                {/each}
              </div>

              <!-- Perk slot rows (0 – MAX_ROWS-1) -->
              {#each Array(MAX_ROWS) as _, rowIdx}
                <div class="pe-grid-row pe-perk-row">
                  <div class="pe-row-label pe-row-label-num">{rowIdx + 1}</div>
                  {#each entry.Levels as lv, lvIdx}
                    {@const perk = lv.Perks[rowIdx]}
                    {@const isSelected = selLvl === lvIdx && selRow === rowIdx}
                    {@const canAdd = !perk && rowIdx === lv.Perks.length && lv.Perks.length < MAX_ROWS}
                    <div
                      class="pe-slot"
                      class:pe-slot-filled={!!perk}
                      class:pe-slot-selected={isSelected}
                      class:pe-slot-addable={canAdd}
                      class:pe-slot-locked={!perk && !canAdd}
                      role="button" tabindex="0"
                      onclick={() => clickSlot(lvIdx, rowIdx, !!perk)}
                      onkeydown={(e) => e.key === 'Enter' && clickSlot(lvIdx, rowIdx, !!perk)}
                      title={perk ? `${getPerkLabel(perk.Type)} · ${perk.Value}` : canAdd ? 'Add perk here' : ''}
                    >
                      {#if perk}
                        <img class="pe-slot-icon" src={getPerkIconSrc(perk.Type)} alt="type {perk.Type}" />
                      {:else if canAdd}
                        <span class="pe-slot-plus">＋</span>
                      {:else}
                        <img class="pe-slot-lock" src={LOCK_ICON} alt="" />
                      {/if}
                      <img
                        class="pe-slot-border"
                        src={isSelected ? BORDER_ACTIVE : BORDER_INACTIVE}
                        alt=""
                      />
                    </div>
                  {/each}
                </div>
              {/each}

            </div>
          </div>

          <!-- ─ Edit panel ─ -->
          {#if selLvl !== null && selRow !== null}
            {@const perk = selectedPerk}
            <div class="pe-edit-panel">
              {#if perk}
                <div class="pe-edit-icon-wrap">
                  <img class="pe-edit-perk-icon" src={getPerkIconSrc(perk.Type)} alt="" />
                  <img class="pe-edit-border" src={BORDER_ACTIVE} alt="" />
                </div>
                <div class="pe-edit-fields">
                  <label class="pe-edit-field">
                    <span class="pe-edit-label">Type</span>
                    <input class="pe-input pe-input-sm" type="number" min="0"
                      value={perk.Type}
                      oninput={(e) => updateSelPerk('Type', parseInt((e.target as HTMLInputElement).value) || 0)}
                    />
                    <span class="pe-edit-type-name">{getPerkLabel(perk.Type)}</span>
                  </label>
                  <label class="pe-edit-field">
                    <span class="pe-edit-label">Value</span>
                    <input class="pe-input pe-input-sm" type="number" step="0.01"
                      value={perk.Value}
                      oninput={(e) => updateSelPerk('Value', parseFloat((e.target as HTMLInputElement).value) || 0)}
                    />
                  </label>
                  <label class="pe-edit-field">
                    <span class="pe-edit-label">SkillId</span>
                    <input class="pe-input pe-input-sm" type="number" min="0"
                      value={perk.SkillId ?? ''}
                      placeholder="—"
                      oninput={(e) => updateSelPerkOptional('SkillId', (e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <label class="pe-edit-field">
                    <span class="pe-edit-label">AugmentType</span>
                    <input class="pe-input pe-input-sm" type="number" min="0"
                      value={perk.AugmentType ?? ''}
                      placeholder="—"
                      oninput={(e) => updateSelPerkOptional('AugmentType', (e.target as HTMLInputElement).value)}
                    />
                    {#if perk.AugmentType !== undefined}
                      <span style={getAugmentIconStyle(perk.AugmentType)} title="Augment icon preview"></span>
                    {/if}
                  </label>
                  <label class="pe-edit-field">
                    <span class="pe-edit-label">SpellId</span>
                    <input class="pe-input pe-input-sm" type="number" min="0"
                      value={perk.SpellId ?? ''}
                      placeholder="—"
                      oninput={(e) => updateSelPerkOptional('SpellId', (e.target as HTMLInputElement).value)}
                    />
                  </label>
                </div>
                <div class="pe-edit-actions">
                  <button class="pe-btn pe-btn-danger" onclick={removeSelPerk}>🗑 Remove</button>
                  <button class="pe-btn" onclick={() => { selLvl = null; selRow = null; }}>✕ Close</button>
                </div>
              {:else}
                <span class="pe-edit-hint">Click ＋ to add a perk in this slot</span>
                <button class="pe-btn" onclick={() => { selLvl = null; selRow = null; }}>✕</button>
              {/if}
            </div>
          {/if}

        {:else}
          <div class="pe-no-sel">
            <img src={getMasteryIconSrc(0)} alt="" class="pe-no-sel-icon" />
            <p>Select a weapon proficiency from the list</p>
          </div>
        {/if}
      </main>
    </div>
  {/if}

  <!-- ── Add entry modal ── -->
  {#if showAddModal}
    <div class="pe-overlay" onclick={() => showAddModal = false} role="presentation">
      <div class="pe-modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 class="pe-modal-title">New Proficiency</h3>
        <label class="pe-modal-field">
          <span>Name</span>
          <input class="pe-input" type="text" bind:value={newEntryName} placeholder="e.g. Sanguine 1H Sword" autofocus />
        </label>
        <label class="pe-modal-field">
          <span>ProficiencyId</span>
          <input class="pe-input" type="number" min="1" bind:value={newEntryId} />
        </label>
        <div class="pe-modal-actions">
          <button class="pe-btn pe-btn-gold" onclick={addEntry} disabled={!newEntryName.trim()}>Create</button>
          <button class="pe-btn" onclick={() => showAddModal = false}>Cancel</button>
        </div>
      </div>
    </div>
  {/if}

</div>

<style>
  /* ─── Root ─────────────────────────────────────────────────────────────── */
  .pe {
    display: flex; flex-direction: column; height: 100vh;
    background: #19150e;
    color: #d4c49a;
    font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
    font-size: 13px;
  }

  /* ─── Header ────────────────────────────────────────────────────────────── */
  .pe-header {
    display: flex; align-items: center; gap: 10px; padding: 6px 14px;
    background: #110e09;
    border-bottom: 2px solid #4a3c1e;
    flex-shrink: 0;
  }
  .pe-title-icon { width: 22px; height: 22px; image-rendering: pixelated; }
  .pe-header-title {
    flex: 1; display: flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 600; color: #c9a84c; letter-spacing: 0.5px;
  }
  .pe-dirty { color: #f59e0b; font-size: 10px; }
  .pe-header-actions { display: flex; gap: 6px; }

  /* ─── Buttons ───────────────────────────────────────────────────────────── */
  .pe-btn {
    padding: 4px 10px; font-size: 12px; cursor: pointer;
    border: 1px solid #4a3c1e; border-radius: 3px;
    background: #2a2218; color: #c9a84c;
    transition: background 0.12s, border-color 0.12s;
  }
  .pe-btn:hover:not(:disabled) { background: #3a3020; border-color: #c9a84c; }
  .pe-btn:disabled { opacity: 0.4; cursor: default; }
  .pe-btn-gold { background: #c9a84c; color: #1a1410; border-color: #c9a84c; font-weight: 700; }
  .pe-btn-gold:hover:not(:disabled) { background: #ddb85c; }
  .pe-btn-back { color: #a89060; }
  .pe-btn-danger { color: #e06060; border-color: #7a3030; background: #2a1818; }
  .pe-btn-danger:hover:not(:disabled) { background: #3a2020; border-color: #c06060; }
  .pe-btn-xs { padding: 2px 7px; font-size: 11px; }
  .pe-btn-lg { padding: 8px 20px; font-size: 14px; }

  /* ─── Banner ────────────────────────────────────────────────────────────── */
  .pe-banner {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
    padding: 6px 14px; font-size: 12px; flex-shrink: 0;
  }
  .pe-banner-error { background: rgba(180,40,40,0.15); border-bottom: 1px solid rgba(180,40,40,0.4); color: #f09090; }
  .pe-banner code { background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 2px; font-size: 10px; }

  /* ─── Empty state ───────────────────────────────────────────────────────── */
  .pe-empty {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 14px; opacity: 0.75;
  }
  .pe-empty-icon { width: 72px; height: 72px; image-rendering: pixelated; }
  .pe-empty h2 { margin: 0; font-size: 20px; color: #c9a84c; }
  .pe-empty p { margin: 0; color: #887a60; }
  .pe-empty code { color: #c9a84c; }

  /* ─── Body layout ───────────────────────────────────────────────────────── */
  .pe-body { flex: 1; display: flex; overflow: hidden; }

  /* ─── Sidebar ───────────────────────────────────────────────────────────── */
  .pe-sidebar {
    width: 240px; flex-shrink: 0; display: flex; flex-direction: column;
    background: #110e09;
    border-right: 2px solid #4a3c1e;
  }
  .pe-sidebar-top {
    display: flex; gap: 5px; padding: 7px;
    border-bottom: 1px solid #3a2e10;
  }
  .pe-search {
    flex: 1; padding: 4px 8px; font-size: 12px;
    background: #1c1810; border: 1px solid #4a3c1e; border-radius: 3px;
    color: #d4c49a;
  }
  .pe-search::placeholder { color: #685a40; }
  .pe-search:focus { outline: 1px solid #c9a84c; }

  .pe-weapon-list { flex: 1; overflow-y: auto; padding: 4px; display: flex; flex-direction: column; gap: 1px; }
  .pe-weapon-item {
    display: flex; align-items: center; gap: 7px;
    padding: 5px 7px; border-radius: 3px; border: 1px solid transparent;
    cursor: pointer; transition: background 0.1s;
    color: #b8a878;
  }
  .pe-weapon-item:hover { background: #2a2210; border-color: #4a3c1e; }
  .pe-weapon-item.active { background: #2e2614; border-color: #c9a84c; color: #e4d0a0; }
  .pe-weapon-icon { width: 26px; height: 26px; image-rendering: pixelated; flex-shrink: 0; }
  .pe-weapon-info { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .pe-weapon-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pe-weapon-meta { font-size: 10px; color: #6a5c3c; }
  .pe-delete-btn {
    background: none; border: none; color: #5a4a2a; cursor: pointer;
    font-size: 11px; padding: 1px 3px; border-radius: 2px; opacity: 0;
    transition: opacity 0.1s;
  }
  .pe-weapon-item:hover .pe-delete-btn { opacity: 1; }
  .pe-delete-btn:hover { color: #e06060; background: rgba(180,40,40,0.15); }
  .pe-list-empty { padding: 20px; text-align: center; color: #5a4a2a; font-size: 12px; }
  .pe-sidebar-foot {
    padding: 5px 10px; font-size: 10px; color: #5a4a2a;
    border-top: 1px solid #3a2e10;
  }

  /* ─── Main panel ────────────────────────────────────────────────────────── */
  .pe-main {
    flex: 1; display: flex; flex-direction: column; overflow: hidden;
    background: #19150e;
  }
  .pe-no-sel {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; opacity: 0.4;
  }
  .pe-no-sel-icon { width: 56px; height: 56px; image-rendering: pixelated; }
  .pe-no-sel p { font-size: 14px; color: #887a60; }

  /* Entry info bar */
  .pe-entry-bar {
    display: flex; align-items: flex-end; gap: 12px; padding: 8px 14px;
    background: #110e09;
    border-bottom: 1px solid #3a2e10;
    flex-shrink: 0;
  }
  .pe-field { display: flex; flex-direction: column; gap: 2px; }
  .pe-field-label { font-size: 10px; color: #7a6a48; text-transform: uppercase; letter-spacing: 0.5px; }
  .pe-input {
    padding: 3px 7px; font-size: 12px;
    background: #1c1810; border: 1px solid #4a3c1e; border-radius: 3px;
    color: #d4c49a;
  }
  .pe-input:focus { outline: 1px solid #c9a84c; }
  .pe-input-lg { min-width: 200px; }
  .pe-input-sm { width: 80px; }

  /* ─── Grid wrapper ──────────────────────────────────────────────────────── */
  .pe-grid-wrap {
    flex: 1; overflow: auto; padding: 16px;
    background: #111009;
  }

  .pe-grid {
    display: inline-flex; flex-direction: column; gap: 0;
    min-width: fit-content;
    background: #19150e;
    padding: 10px 10px 6px 10px;
    border: 1px solid #3a2e10;
    border-radius: 4px;
  }

  .pe-grid-row {
    display: flex; align-items: center; gap: 2px;
  }

  /* Row label */
  .pe-row-label { width: 22px; flex-shrink: 0; }
  .pe-row-label-text { font-size: 9px; color: #5a4a28; text-align: right; text-transform: uppercase; }
  .pe-row-label-num { font-size: 9px; color: #4a3a18; text-align: right; }

  /* Stars row */
  .pe-stars-row { margin-bottom: 4px; }
  .pe-star-cell {
    width: 76px; display: flex; justify-content: center; align-items: center; gap: 2px;
    flex-wrap: wrap; min-height: 14px;
  }
  .pe-star { width: 12px; height: 12px; image-rendering: pixelated; }

  /* Level header cells */
  .pe-header-row { margin-bottom: 2px; }
  .pe-level-cell {
    width: 76px; display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 5px 2px 3px; position: relative;
    background: #1c1810;
    border: 1px solid #3a2e10;
    border-bottom: none;
  }
  .pe-level-cell.gold { border-color: #6a5430; background: #221c0e; }
  .pe-mastery-icon { width: 40px; height: 40px; image-rendering: pixelated; }
  .pe-level-num { font-size: 9px; color: #6a5a38; text-align: center; }
  .pe-remove-lvl {
    position: absolute; top: 2px; right: 3px;
    background: none; border: none; color: #3a2a10; cursor: pointer;
    font-size: 9px; padding: 0; line-height: 1;
    opacity: 0; transition: opacity 0.1s;
  }
  .pe-level-cell:hover .pe-remove-lvl { opacity: 1; }
  .pe-remove-lvl:hover { color: #e06060; }

  /* XP row */
  .pe-xp-row { margin-bottom: 4px; }
  .pe-xp-cell { width: 76px; }
  .pe-xp-input {
    width: 100%; padding: 2px 4px; font-size: 9px;
    background: #151208; border: 1px solid #3a2e10; border-top: none;
    color: #7a6a48; text-align: center; box-sizing: border-box;
  }
  .pe-xp-input::placeholder { color: #3a2a10; }
  .pe-xp-input:focus { outline: 1px solid #6a5a38; }

  /* ─── Perk slots ────────────────────────────────────────────────────────── */
  .pe-slot {
    width: 76px; height: 76px; position: relative;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    background: #0c0a06;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .pe-slot-icon {
    position: absolute;
    inset: 8px;
    width: calc(100% - 16px);
    height: calc(100% - 16px);
    image-rendering: pixelated;
    object-fit: contain;
  }

  .pe-slot-lock {
    position: relative; z-index: 1;
    width: 18px; height: 28px;
    image-rendering: pixelated;
    opacity: 0.25;
  }

  .pe-slot-border {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    image-rendering: pixelated;
    pointer-events: none;
  }

  .pe-slot-filled:hover .pe-slot-border { filter: brightness(1.35); }
  .pe-slot-selected .pe-slot-border { filter: brightness(1.5); }

  .pe-slot-addable { cursor: pointer; background: #131007; }
  .pe-slot-addable:hover { background: #1c1810; }
  .pe-slot-plus {
    font-size: 22px; color: #3a2e10; position: relative; z-index: 1;
    transition: color 0.15s;
  }
  .pe-slot-addable:hover .pe-slot-plus { color: #c9a84c; }

  .pe-slot-locked { cursor: default; }
  .pe-slot-locked .pe-slot-border { opacity: 0.2; }

  /* ─── Edit panel ────────────────────────────────────────────────────────── */
  .pe-edit-panel {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px;
    background: #110e09;
    border-top: 2px solid #4a3c1e;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .pe-edit-icon-wrap {
    width: 76px; height: 76px; position: relative; flex-shrink: 0;
    background: #0c0a06;
  }
  .pe-edit-perk-icon {
    position: absolute; inset: 8px;
    width: calc(100% - 16px); height: calc(100% - 16px);
    image-rendering: pixelated; object-fit: contain;
  }
  .pe-edit-border {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    image-rendering: pixelated;
  }

  .pe-edit-fields { display: flex; flex-wrap: wrap; gap: 10px; flex: 1; }
  .pe-edit-field { display: flex; align-items: center; gap: 5px; }
  .pe-edit-label { font-size: 10px; color: #7a6a48; white-space: nowrap; }
  .pe-edit-type-name { font-size: 10px; color: #c9a84c; white-space: nowrap; }

  .pe-edit-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .pe-edit-hint { font-size: 12px; color: #6a5a38; }

  /* ─── Modal ─────────────────────────────────────────────────────────────── */
  .pe-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center; z-index: 200;
  }
  .pe-modal {
    background: #1c1810; border: 2px solid #4a3c1e; border-radius: 4px;
    padding: 20px; width: 300px; display: flex; flex-direction: column; gap: 12px;
  }
  .pe-modal-title { margin: 0; font-size: 15px; color: #c9a84c; }
  .pe-modal-field { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #7a6a48; }
  .pe-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
</style>
