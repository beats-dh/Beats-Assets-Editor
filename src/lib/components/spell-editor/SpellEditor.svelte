<script lang="ts">
    // Structured editor for spells.json — a searchable list plus a dedicated
    // widget per field. Editing `name`/`spellid` auto-syncs the matching
    // spells-previews.json record (by spellid) via the onsync callback.
    import { translate } from "../../../i18n";
    import ListField from "./ListField.svelte";
    import { SPELL_FIELDS, blankSpell, type Spell } from "./spellSchema";

    interface Props {
        spells: Spell[];
        /** Called whenever the spells array is mutated (add/remove/edit). */
        onchange: (next: Spell[]) => void;
        /** Sync shared fields to the preview of the same spellid. */
        onsync?: (spellid: number, patch: { name?: string }) => void;
        /** Notify when a spellid was renumbered, so previews can follow. */
        onrenumber?: (oldId: number, newId: number) => void;
    }
    let { spells, onchange, onsync, onrenumber }: Props = $props();

    let search = $state("");
    let selectedId = $state<number | null>(null);

    let filtered = $derived.by(() => {
        const q = search.toLowerCase();
        return spells
            .filter(
                (s) =>
                    !q ||
                    String(s.spellid).includes(q) ||
                    (s.name ?? "").toLowerCase().includes(q),
            )
            .sort((a, b) => a.spellid - b.spellid);
    });

    let selected = $derived(
        selectedId === null
            ? null
            : (spells.find((s) => s.spellid === selectedId) ?? null),
    );

    function select(id: number) {
        selectedId = id;
    }

    /** Apply a field change to the selected spell (immutably) and bubble up. */
    function setField(key: string, value: unknown) {
        if (!selected) return;
        const oldId = selected.spellid;
        const next = spells.map((s) =>
            s.spellid === oldId ? { ...s, [key]: value } : s,
        );
        onchange(next);

        if (key === "name" && typeof value === "string") {
            onsync?.(oldId, { name: value });
        }
        if (key === "spellid" && typeof value === "number" && value !== oldId) {
            onrenumber?.(oldId, value);
            selectedId = value;
        }
    }

    function numberOr(value: string, fallback = 0): number {
        const n = Number.parseInt(value, 10);
        return Number.isNaN(n) ? fallback : n;
    }

    function addSpell() {
        const maxId = spells.reduce((m, s) => Math.max(m, s.spellid), 0);
        const id = maxId + 1;
        onchange([...spells, blankSpell(id)]);
        selectedId = id;
    }

    function duplicateSpell() {
        if (!selected) return;
        const maxId = spells.reduce((m, s) => Math.max(m, s.spellid), 0);
        const id = maxId + 1;
        const clone: Spell = {
            ...structuredClone($state.snapshot(selected)),
            spellid: id,
            name: `${selected.name} (Copy)`,
        };
        onchange([...spells, clone]);
        selectedId = id;
    }

    function deleteSpell() {
        if (selected === null || selectedId === null) return;
        onchange(spells.filter((s) => s.spellid !== selectedId));
        selectedId = null;
    }

    // Read a field value from the selected spell with a typed default per kind.
    function val(key: string): unknown {
        return selected ? selected[key] : undefined;
    }
</script>

<div class="spell-editor">
    <!-- List -->
    <div class="se-list">
        <input
            class="se-search"
            placeholder={translate("spell.search")}
            bind:value={search}
        />
        <div class="se-items">
            {#each filtered as s (s.spellid)}
                <button
                    class="se-item"
                    class:selected={s.spellid === selectedId}
                    onclick={() => select(s.spellid)}
                >
                    <span class="se-id">#{s.spellid}</span>
                    <span class="se-name">{s.name}</span>
                </button>
            {/each}
        </div>
        <div class="se-list-actions">
            <button class="rcc-btn small accent" onclick={addSpell}>
                {translate("spell.btn.new")}
            </button>
            <button
                class="rcc-btn small"
                onclick={duplicateSpell}
                disabled={!selected}
            >
                {translate("spell.btn.duplicate")}
            </button>
            <button
                class="rcc-btn small danger"
                onclick={deleteSpell}
                disabled={!selected}
            >
                {translate("spell.btn.delete")}
            </button>
        </div>
    </div>

    <!-- Form -->
    <div class="se-form">
        {#if selected}
            <div class="se-grid">
                {#each SPELL_FIELDS as f (f.key)}
                    <label class="se-field" class:wide={f.kind === "textarea" || f.kind === "list"}>
                        <span class="se-label">{f.label}</span>
                        {#if f.kind === "number"}
                            <input
                                type="number"
                                value={(val(f.key) as number) ?? 0}
                                oninput={(e) =>
                                    setField(
                                        f.key,
                                        numberOr(e.currentTarget.value),
                                    )}
                            />
                        {:else if f.kind === "text"}
                            <input
                                type="text"
                                value={(val(f.key) as string) ?? ""}
                                oninput={(e) =>
                                    setField(f.key, e.currentTarget.value)}
                            />
                        {:else if f.kind === "textarea"}
                            <textarea
                                rows="4"
                                value={(val(f.key) as string) ?? ""}
                                oninput={(e) =>
                                    setField(f.key, e.currentTarget.value)}
                            ></textarea>
                        {:else if f.kind === "bool"}
                            <input
                                type="checkbox"
                                checked={Boolean(val(f.key))}
                                onchange={(e) =>
                                    setField(f.key, e.currentTarget.checked)}
                            />
                        {:else if f.kind === "enum"}
                            <select
                                value={(val(f.key) as string) ?? ""}
                                onchange={(e) =>
                                    setField(f.key, e.currentTarget.value)}
                            >
                                {#each f.options ?? [] as opt (opt)}
                                    <option value={opt}
                                        >{opt === "" ? "—" : opt}</option
                                    >
                                {/each}
                            </select>
                        {:else if f.kind === "list"}
                            <ListField
                                values={(val(f.key) as string[]) ?? []}
                                suggestions={f.suggestions ?? []}
                                onchange={(next) => setField(f.key, next)}
                            />
                        {/if}
                    </label>
                {/each}
            </div>
        {:else}
            <div class="se-empty">{translate("spell.selectPrompt")}</div>
        {/if}
    </div>
</div>

<style>
    .spell-editor {
        display: flex;
        flex: 1;
        overflow: hidden;
        min-height: 0;
    }
    .se-list {
        width: 280px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--border-color);
    }
    .se-search {
        margin: 8px;
        padding: 6px 10px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--control-bg);
        color: var(--text-primary);
        font-size: 12px;
    }
    .se-items {
        flex: 1;
        overflow-y: auto;
        scrollbar-width: thin;
    }
    .se-item {
        display: flex;
        align-items: baseline;
        gap: 8px;
        width: 100%;
        padding: 6px 12px;
        border: none;
        border-bottom: 1px solid var(--border-soft-20);
        background: transparent;
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
    }
    .se-item:hover {
        background: rgba(79, 70, 229, 0.08);
    }
    .se-item.selected {
        background: rgba(79, 70, 229, 0.15);
        border-left: 3px solid var(--primary-accent);
    }
    .se-id {
        font-size: 10px;
        color: var(--text-muted);
        font-family: monospace;
    }
    .se-name {
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .se-list-actions {
        display: flex;
        gap: 6px;
        padding: 8px;
        border-top: 1px solid var(--border-color);
    }
    .se-form {
        flex: 1;
        overflow-y: auto;
        padding: 12px 16px;
        scrollbar-width: thin;
    }
    .se-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 10px 14px;
    }
    .se-field {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    .se-field.wide {
        grid-column: 1 / -1;
    }
    .se-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
    }
    .se-field input[type="text"],
    .se-field input[type="number"],
    .se-field select,
    .se-field textarea {
        padding: 5px 8px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--control-bg);
        color: var(--text-primary);
        font-size: 12px;
        font-family: inherit;
    }
    .se-field input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--primary-accent);
    }
    .se-empty {
        color: var(--text-muted);
        padding: 24px;
        text-align: center;
    }
</style>
