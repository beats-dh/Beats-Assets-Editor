<script lang="ts">
    // An editable string-list field rendered as removable chips, with an add
    // input and optional one-click suggestions (e.g. vocations).
    interface Props {
        values: string[];
        suggestions?: readonly string[];
        placeholder?: string;
        onchange: (next: string[]) => void;
    }
    let { values, suggestions = [], placeholder = "add…", onchange }: Props = $props();

    let draft = $state("");

    function add(value: string) {
        const v = value.trim();
        if (!v || values.includes(v)) return;
        onchange([...values, v]);
        draft = "";
    }
    function remove(i: number) {
        onchange(values.filter((_, idx) => idx !== i));
    }
    function onKey(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
        }
    }
</script>

<div class="list-field">
    <div class="chips">
        {#each values as v, i (v + i)}
            <span class="chip">
                {v}
                <button
                    type="button"
                    class="chip-x"
                    onclick={() => remove(i)}
                    aria-label="remove">×</button
                >
            </span>
        {/each}
        <input
            class="chip-input"
            bind:value={draft}
            {placeholder}
            onkeydown={onKey}
        />
    </div>
    {#if suggestions.length > 0}
        <div class="suggestions">
            {#each suggestions as s (s)}
                {#if !values.includes(s)}
                    <button
                        type="button"
                        class="suggestion"
                        onclick={() => add(s)}>+ {s}</button
                    >
                {/if}
            {/each}
        </div>
    {/if}
</div>

<style>
    .list-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        align-items: center;
        padding: 4px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--control-bg);
        min-height: 30px;
    }
    .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 9999px;
        background: rgba(99, 102, 241, 0.18);
        color: var(--primary-accent);
    }
    .chip-x {
        border: none;
        background: none;
        color: inherit;
        cursor: pointer;
        font-size: 13px;
        line-height: 1;
        padding: 0;
    }
    .chip-input {
        flex: 1;
        min-width: 80px;
        border: none;
        background: none;
        color: var(--text-primary);
        font-size: 12px;
        outline: none;
    }
    .suggestions {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }
    .suggestion {
        font-size: 10px;
        padding: 1px 6px;
        border: 1px dashed var(--border-color);
        border-radius: 9999px;
        background: none;
        color: var(--text-muted);
        cursor: pointer;
    }
    .suggestion:hover {
        color: var(--primary-accent);
        border-color: var(--primary-accent);
    }
</style>
