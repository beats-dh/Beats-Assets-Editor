<script lang="ts">
    import { npcState } from "../../../../stores/npcState.svelte";
    import { translate } from "../../../../i18n";

    let hasScripts = $state(false);

    $effect(() => {
        hasScripts = !!npcState.currentNpc?.interactions;
    });

    function toggleEditor() {
        hasScripts = !hasScripts;
    }

    function updateScript(e: Event) {
        if (!npcState.currentNpc?.interactions) return;
        const target = e.target as HTMLTextAreaElement;
        npcState.currentNpc.interactions.rawCode = target.value;
    }
</script>

<div class="monster-card">
    <div class="monster-card-header">
        <div
            style="display: flex; justify-content: space-between; align-items: center; width: 100%;"
        >
            <span style="display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 14px; color: #E5C07B;">⚡</span>
                {translate("npc.card.scripting.title")}
            </span>
            <label
                for="viewEditor"
                style="font-size: 13px; font-weight: normal; display: flex; align-items: center; gap: 6px; cursor: pointer;"
            >
                <input
                    id="viewEditor"
                    style="accent-color: #8b5cf6; width: 16px; height: 16px; cursor: pointer; margin: 0;"
                    type="checkbox"
                    checked={hasScripts}
                    onchange={toggleEditor}
                />
                {translate("npc.card.scripting.viewEditor")}
            </label>
        </div>
    </div>
    <div
        class="monster-card-body"
        style="padding: 0; background-color: #1e1e1e; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; overflow: hidden; display: flex; flex-direction: column;"
        class:disabled={!hasScripts}
    >
        {#if !hasScripts}
            <div
                style="padding: 40px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px;"
            >
                {translate("npc.card.scripting.hint")}
            </div>
        {:else}
            <!-- VS Code Style Toolbar -->
            <div class="ide-toolbar">
                <div class="ide-tabs">
                    <div class="ide-tab active">
                        <span class="ide-icon" style="color: #519ABA;">📄</span>
                        script.lua
                    </div>
                </div>
                <div class="ide-actions">
                    <span class="ide-lang">LUA</span>
                </div>
            </div>

            <div class="script-editor-container">
                <!-- Faux Line Numbers -->
                <div class="line-numbers">
                    {#each Array(20) as _, i}
                        <span>{i + 1}</span>
                    {/each}
                </div>

                <textarea
                    class="code-textarea"
                    spellcheck="false"
                    placeholder={translate("npc.card.scripting.placeholder")}
                    value={npcState.currentNpc!.interactions!.rawCode}
                    oninput={updateScript}
                    title={translate("npc.card.scripting.titleAttr")}
                ></textarea>
            </div>

            <div class="info-footer">
                <span class="footer-icon">💡</span>
                <span
                    ><strong
                        >{translate("npc.card.scripting.footerTitle")}</strong
                    >
                    {@html translate("npc.card.scripting.footerHint")}</span
                >
            </div>
        {/if}
    </div>
</div>

<style>
    .ide-toolbar {
        display: flex;
        justify-content: space-between;
        background-color: #252526;
        border-bottom: 1px solid #1e1e1e;
        position: relative;
    }

    .ide-tabs {
        display: flex;
    }

    .ide-tab {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.4);
        background-color: #2d2d2d;
        cursor: pointer;
        position: relative;
    }

    .ide-tab.active {
        background-color: #1e1e1e;
        color: #d4d4d4;
    }

    .ide-tab.active::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 1px;
        background-color: #007acc;
    }

    .ide-actions {
        display: flex;
        align-items: center;
        padding: 0 16px;
    }

    .ide-lang {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .script-editor-container {
        display: flex;
        min-height: 350px;
        width: 100%;
        flex: 1;
        background-color: #1e1e1e;
    }

    .line-numbers {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        padding: 12px 16px;
        background-color: #1e1e1e;
        color: #858585;
        font-family: "Consolas", "Courier New", monospace;
        font-size: 13px;
        line-height: 1.6;
        user-select: none;
        border-right: 1px solid #333;
    }

    .code-textarea {
        flex: 1;
        width: 100%;
        background-color: transparent;
        border: none;
        color: #d4d4d4; /* VSCode Light Gray */
        font-family: "Consolas", "Courier New", monospace;
        font-size: 13px;
        line-height: 1.6;
        padding: 12px;
        resize: vertical;
        min-height: 350px;
        white-space: pre;
        tab-size: 4;
    }

    .code-textarea:focus {
        outline: none;
    }

    .code-textarea::placeholder {
        color: rgba(255, 255, 255, 0.2);
        font-style: italic;
    }

    .info-footer {
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: #007acc;
        padding: 6px 12px;
        font-size: 12px;
        color: #ffffff;
    }

    .footer-icon {
        font-size: 14px;
    }
</style>
