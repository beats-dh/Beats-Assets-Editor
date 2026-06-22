<script lang="ts">
    // Structured editor for spells-previews.json — searchable list plus a
    // structural FX editor: spellid/name/range, timestamps[] each with actions[]
    // (type + id/x/y), and initActions[]. `name`/`spellid` auto-sync the spell.
    import { translate } from "../../../i18n";
    import {
        ACTION_TYPES,
        ACTION_ID_FIELD,
        blankAction,
        blankPreview,
        type ActionType,
        type FxAction,
        type SpellPreview,
    } from "./spellSchema";

    interface Props {
        previews: SpellPreview[];
        onchange: (next: SpellPreview[]) => void;
        onsync?: (spellid: number, patch: { name?: string }) => void;
        onrenumber?: (oldId: number, newId: number) => void;
    }
    let { previews, onchange, onsync, onrenumber }: Props = $props();

    let search = $state("");
    let selectedId = $state<number | null>(null);
    let tsIndex = $state(0);

    let filtered = $derived.by(() => {
        const q = search.toLowerCase();
        return previews
            .filter(
                (p) =>
                    !q ||
                    String(p.spellid).includes(q) ||
                    (p.name ?? "").toLowerCase().includes(q),
            )
            .sort((a, b) => a.spellid - b.spellid);
    });

    let selected = $derived(
        selectedId === null
            ? null
            : (previews.find((p) => p.spellid === selectedId) ?? null),
    );

    function select(id: number) {
        selectedId = id;
        tsIndex = 0;
    }

    /** Replace the selected preview immutably and bubble up. */
    function update(mut: (p: SpellPreview) => SpellPreview) {
        if (!selected) return;
        const id = selected.spellid;
        const next = previews.map((p) =>
            p.spellid === id ? mut(structuredClone($state.snapshot(p))) : p,
        );
        onchange(next);
    }

    function setName(value: string) {
        const id = selected?.spellid;
        update((p) => ({ ...p, name: value }));
        if (id !== undefined) onsync?.(id, { name: value });
    }
    function setRange(value: number) {
        update((p) => ({ ...p, range: value }));
    }
    function setSpellId(value: number) {
        const oldId = selected?.spellid;
        if (oldId === undefined || value === oldId) return;
        update((p) => ({ ...p, spellid: value }));
        onrenumber?.(oldId, value);
        selectedId = value;
    }

    function numberOr(v: string, fallback = 0): number {
        const n = Number.parseInt(v, 10);
        return Number.isNaN(n) ? fallback : n;
    }

    // ---- timestamps ----
    function addTimestamp() {
        update((p) => ({
            ...p,
            timestamps: [...p.timestamps, { timestamp: 0, actions: [] }],
        }));
        tsIndex = (selected?.timestamps.length ?? 0);
    }
    function removeTimestamp(i: number) {
        update((p) => ({
            ...p,
            timestamps: p.timestamps.filter((_, idx) => idx !== i),
        }));
        tsIndex = Math.max(0, tsIndex - (i <= tsIndex ? 1 : 0));
    }
    function setTimestampValue(i: number, value: number) {
        update((p) => ({
            ...p,
            timestamps: p.timestamps.map((t, idx) =>
                idx === i ? { ...t, timestamp: value } : t,
            ),
        }));
    }

    // ---- actions (within a timestamp, or initActions when ts === -1) ----
    function mutateActions(ts: number, fn: (acts: FxAction[]) => FxAction[]) {
        update((p) => {
            if (ts < 0) return { ...p, initActions: fn([...p.initActions]) };
            return {
                ...p,
                timestamps: p.timestamps.map((t, idx) =>
                    idx === ts ? { ...t, actions: fn([...t.actions]) } : t,
                ),
            };
        });
    }
    function addAction(ts: number) {
        mutateActions(ts, (a) => [...a, blankAction("fieldEffect")]);
    }
    function removeAction(ts: number, ai: number) {
        mutateActions(ts, (a) => a.filter((_, idx) => idx !== ai));
    }
    function setActionType(ts: number, ai: number, type: ActionType) {
        mutateActions(ts, (a) =>
            a.map((act, idx) => {
                if (idx !== ai) return act;
                // Rebuild keeping x/y, swapping the id field for the new type.
                const next = blankAction(type);
                next.x = act.x;
                next.y = act.y;
                return next;
            }),
        );
    }
    function setActionField(ts: number, ai: number, key: string, value: number) {
        mutateActions(ts, (a) =>
            a.map((act, idx) =>
                idx === ai ? { ...act, [key]: value } : act,
            ),
        );
    }

    function addPreview() {
        const maxId = previews.reduce((m, p) => Math.max(m, p.spellid), 0);
        const id = maxId + 1;
        onchange([...previews, blankPreview(id)]);
        selectedId = id;
    }
    function duplicatePreview() {
        if (!selected) return;
        const maxId = previews.reduce((m, p) => Math.max(m, p.spellid), 0);
        const id = maxId + 1;
        const clone: SpellPreview = {
            ...structuredClone($state.snapshot(selected)),
            spellid: id,
            name: `${selected.name} (Copy)`,
        };
        onchange([...previews, clone]);
        selectedId = id;
    }
    function deletePreview() {
        if (selectedId === null) return;
        onchange(previews.filter((p) => p.spellid !== selectedId));
        selectedId = null;
    }

    let currentTs = $derived(
        selected && tsIndex < selected.timestamps.length
            ? selected.timestamps[tsIndex]
            : null,
    );
</script>

<div class="fx-editor">
    <!-- List -->
    <div class="fx-list">
        <input
            class="fx-search"
            placeholder={translate("spell.search")}
            bind:value={search}
        />
        <div class="fx-items">
            {#each filtered as p (p.spellid)}
                <button
                    class="fx-item"
                    class:selected={p.spellid === selectedId}
                    onclick={() => select(p.spellid)}
                >
                    <span class="fx-id">#{p.spellid}</span>
                    <span class="fx-name">{p.name}</span>
                </button>
            {/each}
        </div>
        <div class="fx-list-actions">
            <button class="rcc-btn small accent" onclick={addPreview}>
                {translate("spell.btn.new")}
            </button>
            <button
                class="rcc-btn small"
                onclick={duplicatePreview}
                disabled={!selected}
            >
                {translate("spell.btn.duplicate")}
            </button>
            <button
                class="rcc-btn small danger"
                onclick={deletePreview}
                disabled={!selected}
            >
                {translate("spell.btn.delete")}
            </button>
        </div>
    </div>

    <!-- Structural editor -->
    <div class="fx-form">
        {#if selected}
            <div class="fx-head">
                <label class="fx-field">
                    <span class="se-label">Spell ID</span>
                    <input
                        type="number"
                        value={selected.spellid}
                        oninput={(e) =>
                            setSpellId(numberOr(e.currentTarget.value))}
                    />
                </label>
                <label class="fx-field grow">
                    <span class="se-label">Name</span>
                    <input
                        type="text"
                        value={selected.name}
                        oninput={(e) => setName(e.currentTarget.value)}
                    />
                </label>
                <label class="fx-field">
                    <span class="se-label">Range</span>
                    <input
                        type="number"
                        value={selected.range ?? 0}
                        oninput={(e) =>
                            setRange(numberOr(e.currentTarget.value))}
                    />
                </label>
            </div>

            <div class="fx-cols">
                <!-- Timestamps -->
                <div class="fx-box">
                    <div class="fx-box-head">
                        <span>{translate("spell.fx.timestamps")}</span>
                        <button
                            class="rcc-btn small accent"
                            onclick={addTimestamp}
                            >{translate("spell.fx.add")}</button
                        >
                    </div>
                    <div class="fx-ts-list">
                        {#each selected.timestamps as t, i (i)}
                            <div
                                class="fx-ts-row"
                                class:selected={i === tsIndex}
                            >
                                <button
                                    class="fx-ts-pick"
                                    onclick={() => (tsIndex = i)}
                                >
                                    t={t.timestamp} · {t.actions.length}
                                    {translate("spell.fx.actions")}
                                </button>
                                <input
                                    type="number"
                                    class="fx-ts-input"
                                    value={t.timestamp}
                                    oninput={(e) =>
                                        setTimestampValue(
                                            i,
                                            numberOr(e.currentTarget.value),
                                        )}
                                />
                                <button
                                    class="rcc-btn small danger"
                                    onclick={() => removeTimestamp(i)}>×</button
                                >
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- Actions of the selected timestamp -->
                <div class="fx-box">
                    <div class="fx-box-head">
                        <span>{translate("spell.fx.actionsOf")} #{tsIndex}</span>
                        <button
                            class="rcc-btn small accent"
                            onclick={() => addAction(tsIndex)}
                            disabled={!currentTs}
                            >{translate("spell.fx.add")}</button
                        >
                    </div>
                    {#if currentTs}
                        {#each currentTs.actions as a, ai (ai)}
                            {@const idField = ACTION_ID_FIELD[
                                a.action as ActionType
                            ]}
                            <div class="fx-action">
                                <select
                                    value={a.action}
                                    onchange={(e) =>
                                        setActionType(
                                            tsIndex,
                                            ai,
                                            e.currentTarget.value as ActionType,
                                        )}
                                >
                                    {#each ACTION_TYPES as t (t)}
                                        <option value={t}>{t}</option>
                                    {/each}
                                </select>
                                {#if idField}
                                    <label class="fx-mini">
                                        <span>id</span>
                                        <input
                                            type="number"
                                            value={(a[idField] as number) ?? 0}
                                            oninput={(e) =>
                                                setActionField(
                                                    tsIndex,
                                                    ai,
                                                    idField,
                                                    numberOr(
                                                        e.currentTarget.value,
                                                    ),
                                                )}
                                        />
                                    </label>
                                {/if}
                                <label class="fx-mini">
                                    <span>x</span>
                                    <input
                                        type="number"
                                        value={a.x}
                                        oninput={(e) =>
                                            setActionField(
                                                tsIndex,
                                                ai,
                                                "x",
                                                numberOr(e.currentTarget.value),
                                            )}
                                    />
                                </label>
                                <label class="fx-mini">
                                    <span>y</span>
                                    <input
                                        type="number"
                                        value={a.y}
                                        oninput={(e) =>
                                            setActionField(
                                                tsIndex,
                                                ai,
                                                "y",
                                                numberOr(e.currentTarget.value),
                                            )}
                                    />
                                </label>
                                <button
                                    class="rcc-btn small danger"
                                    onclick={() => removeAction(tsIndex, ai)}
                                    >×</button
                                >
                            </div>
                        {/each}
                    {:else}
                        <div class="fx-empty">
                            {translate("spell.fx.pickTimestamp")}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Init actions -->
            <div class="fx-box">
                <div class="fx-box-head">
                    <span>{translate("spell.fx.initActions")}</span>
                    <button
                        class="rcc-btn small accent"
                        onclick={() => addAction(-1)}
                        >{translate("spell.fx.add")}</button
                    >
                </div>
                {#each selected.initActions as a, ai (ai)}
                    {@const idField = ACTION_ID_FIELD[a.action as ActionType]}
                    <div class="fx-action">
                        <select
                            value={a.action}
                            onchange={(e) =>
                                setActionType(
                                    -1,
                                    ai,
                                    e.currentTarget.value as ActionType,
                                )}
                        >
                            {#each ACTION_TYPES as t (t)}
                                <option value={t}>{t}</option>
                            {/each}
                        </select>
                        {#if idField}
                            <label class="fx-mini">
                                <span>id</span>
                                <input
                                    type="number"
                                    value={(a[idField] as number) ?? 0}
                                    oninput={(e) =>
                                        setActionField(
                                            -1,
                                            ai,
                                            idField,
                                            numberOr(e.currentTarget.value),
                                        )}
                                />
                            </label>
                        {/if}
                        <label class="fx-mini">
                            <span>x</span>
                            <input
                                type="number"
                                value={a.x}
                                oninput={(e) =>
                                    setActionField(
                                        -1,
                                        ai,
                                        "x",
                                        numberOr(e.currentTarget.value),
                                    )}
                            />
                        </label>
                        <label class="fx-mini">
                            <span>y</span>
                            <input
                                type="number"
                                value={a.y}
                                oninput={(e) =>
                                    setActionField(
                                        -1,
                                        ai,
                                        "y",
                                        numberOr(e.currentTarget.value),
                                    )}
                            />
                        </label>
                        <button
                            class="rcc-btn small danger"
                            onclick={() => removeAction(-1, ai)}>×</button
                        >
                    </div>
                {/each}
            </div>
        {:else}
            <div class="fx-empty">{translate("spell.selectPrompt")}</div>
        {/if}
    </div>
</div>

<style>
    .fx-editor {
        display: flex;
        flex: 1;
        overflow: hidden;
        min-height: 0;
    }
    .fx-list {
        width: 260px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--border-color);
    }
    .fx-search {
        margin: 8px;
        padding: 6px 10px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--control-bg);
        color: var(--text-primary);
        font-size: 12px;
    }
    .fx-items {
        flex: 1;
        overflow-y: auto;
        scrollbar-width: thin;
    }
    .fx-item {
        display: flex;
        gap: 8px;
        align-items: baseline;
        width: 100%;
        padding: 6px 12px;
        border: none;
        border-bottom: 1px solid var(--border-soft-20);
        background: transparent;
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
    }
    .fx-item:hover {
        background: rgba(79, 70, 229, 0.08);
    }
    .fx-item.selected {
        background: rgba(79, 70, 229, 0.15);
        border-left: 3px solid var(--primary-accent);
    }
    .fx-id {
        font-size: 10px;
        font-family: monospace;
        color: var(--text-muted);
    }
    .fx-name {
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .fx-list-actions {
        display: flex;
        gap: 6px;
        padding: 8px;
        border-top: 1px solid var(--border-color);
    }
    .fx-form {
        flex: 1;
        overflow-y: auto;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scrollbar-width: thin;
    }
    .fx-head {
        display: flex;
        gap: 12px;
        align-items: flex-end;
    }
    .fx-field {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    .fx-field.grow {
        flex: 1;
    }
    .se-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
    }
    .fx-field input {
        padding: 5px 8px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--control-bg);
        color: var(--text-primary);
        font-size: 12px;
    }
    .fx-cols {
        display: flex;
        gap: 12px;
        align-items: flex-start;
    }
    .fx-box {
        flex: 1;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
    }
    .fx-box-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 10px;
        background: var(--tertiary-bg);
        border-bottom: 1px solid var(--border-color);
        font-size: 11px;
        font-weight: 600;
        color: var(--text-secondary);
    }
    .fx-ts-list {
        max-height: 200px;
        overflow-y: auto;
    }
    .fx-ts-row {
        display: flex;
        gap: 4px;
        align-items: center;
        padding: 3px 6px;
        border-bottom: 1px solid var(--border-soft-20);
    }
    .fx-ts-row.selected {
        background: rgba(79, 70, 229, 0.12);
    }
    .fx-ts-pick {
        flex: 1;
        text-align: left;
        border: none;
        background: none;
        color: var(--text-primary);
        font-size: 11px;
        cursor: pointer;
    }
    .fx-ts-input {
        width: 56px;
        padding: 2px 4px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--control-bg);
        color: var(--text-primary);
        font-size: 11px;
    }
    .fx-action {
        display: flex;
        gap: 6px;
        align-items: center;
        padding: 5px 8px;
        border-bottom: 1px solid var(--border-soft-20);
        flex-wrap: wrap;
    }
    .fx-action select {
        padding: 3px 6px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--control-bg);
        color: var(--text-primary);
        font-size: 11px;
    }
    .fx-mini {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 10px;
        color: var(--text-muted);
    }
    .fx-mini input {
        width: 56px;
        padding: 2px 4px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--control-bg);
        color: var(--text-primary);
        font-size: 11px;
    }
    .fx-empty {
        color: var(--text-muted);
        padding: 16px;
        text-align: center;
        font-size: 12px;
    }
</style>
