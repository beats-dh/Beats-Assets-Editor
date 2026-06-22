<script lang="ts">
    // Container that loads BOTH spell JSONs, hosts the structured editors as
    // tabs, keeps the shared `name` in sync by spellid, and serializes the
    // edited data back out for the caller to save (embed/disk/rcc).
    import { invoke } from "@tauri-apps/api/core";
    import { COMMANDS } from "../../../commands";
    import { translate } from "../../../i18n";
    import SpellEditor from "./SpellEditor.svelte";
    import PreviewFxEditor from "./PreviewFxEditor.svelte";
    import type { Spell, SpellPreview } from "./spellSchema";

    interface Props {
        /** The currently loaded source: "exe" or "rcc". */
        source: "exe" | "rcc";
        /** Entry indices of the two JSONs in the loaded source (if present). */
        spellsIndex: number | null;
        previewsIndex: number | null;
        /** Apply the edited JSON text back to the client. Returns when done. */
        onsave: (
            which: "spells.json" | "spells-previews.json",
            content: string,
        ) => Promise<void>;
        onstatus?: (msg: string) => void;
    }
    let { source, spellsIndex, previewsIndex, onsave, onstatus }: Props =
        $props();

    let tab = $state<"spells" | "previews">("spells");
    let spells = $state<Spell[]>([]);
    let previews = $state<SpellPreview[]>([]);
    let loaded = $state(false);
    let dirty = $state(false);
    let loadError = $state("");

    function getCmd() {
        return source === "exe"
            ? COMMANDS.EXE_GET_RESOURCE
            : COMMANDS.RCC_GET_RESOURCE;
    }

    async function loadJson(index: number): Promise<unknown> {
        const data = await invoke<number[]>(getCmd(), { index });
        const text = new TextDecoder("utf-8").decode(new Uint8Array(data));
        return JSON.parse(text);
    }

    $effect(() => {
        // Reload when the source / indices change.
        const si = spellsIndex;
        const pi = previewsIndex;
        loaded = false;
        loadError = "";
        (async () => {
            try {
                if (si !== null) {
                    const arr = (await loadJson(si)) as Spell[];
                    spells = Array.isArray(arr) ? arr : [];
                }
                if (pi !== null) {
                    const obj = (await loadJson(pi)) as Record<
                        string,
                        SpellPreview
                    >;
                    // previews.json is a map keyed by spellid → flatten to array.
                    previews = Object.values(obj).sort(
                        (a, b) => a.spellid - b.spellid,
                    );
                }
                loaded = true;
                dirty = false;
            } catch (e) {
                loadError = String(e);
            }
        })();
    });

    // ---- shared-field sync (by spellid) ----
    function syncNameToPreview(spellid: number, patch: { name?: string }) {
        if (patch.name === undefined) return;
        const idx = previews.findIndex((p) => p.spellid === spellid);
        if (idx >= 0 && previews[idx].name !== patch.name) {
            previews = previews.map((p, i) =>
                i === idx ? { ...p, name: patch.name! } : p,
            );
        }
        dirty = true;
    }
    function syncNameToSpell(spellid: number, patch: { name?: string }) {
        if (patch.name === undefined) return;
        const idx = spells.findIndex((s) => s.spellid === spellid);
        if (idx >= 0 && spells[idx].name !== patch.name) {
            spells = spells.map((s, i) =>
                i === idx ? { ...s, name: patch.name! } : s,
            );
        }
        dirty = true;
    }
    function renumberPreview(oldId: number, newId: number) {
        previews = previews.map((p) =>
            p.spellid === oldId ? { ...p, spellid: newId } : p,
        );
        dirty = true;
    }
    function renumberSpell(oldId: number, newId: number) {
        spells = spells.map((s) =>
            s.spellid === oldId ? { ...s, spellid: newId } : s,
        );
        dirty = true;
    }

    function onSpellsChange(next: Spell[]) {
        spells = next;
        dirty = true;
    }
    function onPreviewsChange(next: SpellPreview[]) {
        previews = next;
        dirty = true;
    }

    // Records present in one file but not the other (helps spot desyncs).
    let orphans = $derived.by(() => {
        const sIds = new Set(spells.map((s) => s.spellid));
        const pIds = new Set(previews.map((p) => p.spellid));
        const onlySpells = [...sIds].filter((id) => !pIds.has(id));
        const onlyPreviews = [...pIds].filter((id) => !sIds.has(id));
        return { onlySpells, onlyPreviews };
    });

    function serializeSpells(): string {
        return JSON.stringify($state.snapshot(spells), null, 4);
    }
    function serializePreviews(): string {
        // Back to the keyed-by-spellid object form, ordered.
        const ordered = [...previews].sort((a, b) => a.spellid - b.spellid);
        const obj: Record<string, SpellPreview> = {};
        for (const p of ordered) obj[String(p.spellid)] = p;
        return JSON.stringify($state.snapshot(obj), null, 4);
    }

    async function saveBoth() {
        try {
            if (spellsIndex !== null)
                await onsave("spells.json", serializeSpells());
            if (previewsIndex !== null)
                await onsave("spells-previews.json", serializePreviews());
            dirty = false;
            onstatus?.(translate("spell.status.saved"));
        } catch (e) {
            onstatus?.(`${translate("spell.status.saveError")}: ${e}`);
        }
    }
</script>

<div class="spell-panel">
    <div class="sp-tabs">
        <button
            class="sp-tab"
            class:active={tab === "spells"}
            onclick={() => (tab = "spells")}
            disabled={spellsIndex === null}
        >
            {translate("spell.tab.spells")} ({spells.length})
        </button>
        <button
            class="sp-tab"
            class:active={tab === "previews"}
            onclick={() => (tab = "previews")}
            disabled={previewsIndex === null}
        >
            {translate("spell.tab.previews")} ({previews.length})
        </button>
        <div class="sp-spacer"></div>
        {#if orphans.onlySpells.length > 0 || orphans.onlyPreviews.length > 0}
            <span
                class="sp-warn"
                title={`${translate("spell.orphans.spells")}: ${orphans.onlySpells.join(", ") || "—"}\n${translate("spell.orphans.previews")}: ${orphans.onlyPreviews.join(", ") || "—"}`}
            >
                ⚠ {orphans.onlySpells.length + orphans.onlyPreviews.length}
                {translate("spell.orphans.label")}
            </span>
        {/if}
        <button
            class="rcc-btn small accent"
            onclick={saveBoth}
            disabled={!loaded || !dirty}
        >
            {translate("spell.btn.saveApply")}
        </button>
    </div>

    {#if loadError}
        <div class="sp-error">{loadError}</div>
    {:else if !loaded}
        <div class="sp-loading">{translate("spell.loading")}</div>
    {:else if tab === "spells"}
        <SpellEditor
            {spells}
            onchange={onSpellsChange}
            onsync={syncNameToPreview}
            onrenumber={renumberPreview}
        />
    {:else}
        <PreviewFxEditor
            {previews}
            onchange={onPreviewsChange}
            onsync={syncNameToSpell}
            onrenumber={renumberSpell}
        />
    {/if}
</div>

<style>
    .spell-panel {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow: hidden;
    }
    .sp-tabs {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: var(--tertiary-bg);
        border-bottom: 1px solid var(--border-color);
    }
    .sp-tab {
        padding: 5px 12px;
        border: 1px solid transparent;
        border-radius: var(--radius-md);
        background: none;
        color: var(--text-secondary);
        font-size: 12px;
        cursor: pointer;
    }
    .sp-tab.active {
        background: var(--surface-bg);
        border-color: var(--primary-accent);
        color: var(--text-primary);
    }
    .sp-tab:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
    .sp-spacer {
        flex: 1;
    }
    .sp-warn {
        font-size: 11px;
        color: var(--warning-color);
        cursor: help;
    }
    .sp-error,
    .sp-loading {
        padding: 24px;
        text-align: center;
        color: var(--text-muted);
    }
    .sp-error {
        color: var(--error-color);
    }
</style>
