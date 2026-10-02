<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "../../../stores/appState.svelte";
  import { npcState } from "../../../stores/npcState.svelte";
  import { invoke } from "../../../utils/invoke";
  import { COMMANDS } from "../../../commands";
  import { ensureAppearancesLoaded } from "../../../appearanceLoader";
  import { showStatus } from "../../../utils";
  import { translate } from "../../../i18n";
  import { open } from "@tauri-apps/plugin-dialog";

  import NpcSidebar from "./NpcSidebar.svelte";
  import NpcForm from "./NpcForm.svelte";
  import SyncShopModal from "./modals/SyncShopModal.svelte";

  let isInitializing = $state(true);
  let showSyncModal = $state(false);
  let initError = $state("");

  function goBack() {
    appState.currentView = "launcher";
  }

  async function handleReload() {
    if (npcState.npcsRootPath) {
      window.dispatchEvent(new CustomEvent("reload-npc-list"));
    }
  }

  async function handleChangeDirectory() {
    try {
      const selection = await open({ directory: true, multiple: false });
      if (typeof selection === "string" && selection) {
        await invoke(COMMANDS.SET_NPC_BASE_PATH, { npcPath: selection });
        npcState.npcsRootPath = selection;
        npcState.cachedNpcsPath = null;
        npcState.currentNpc = null;
        npcState.currentFilePath = null;
      }
    } catch (error) {
      console.error("Failed to select NPC directory:", error);
      showStatus(translate("npc.editor.error.selectDir"), "error");
    }
  }

  onMount(async () => {
    try {
      await ensureAppearancesLoaded();
      if (!npcState.npcsRootPath) {
        try {
          const savedPath = await invoke<string | null>(
            COMMANDS.GET_NPC_BASE_PATH,
          );
          if (savedPath) npcState.npcsRootPath = savedPath;
        } catch (e) {
          console.log("No saved npc path found");
        }
      }
    } catch (error) {
      console.error("Failed to initialize NPC Editor:", error);
      initError = error instanceof Error ? error.message : String(error);
    } finally {
      isInitializing = false;
    }
  });
</script>

<div class="monster-editor-container">
  <header class="monster-editor-header">
    <button class="editor-back-button" onclick={goBack}>
      <span class="btn-icon">🏠</span>
      <span>{translate("npc.editor.back")}</span>
    </button>

    <h1>{translate("npc.editor.title")}</h1>

    <div class="monster-header-actions">
      <button
        type="button"
        class="editor-icon-button"
        onclick={handleReload}
        title={translate("npc.editor.reloadTitle")}
      >
        <span class="btn-icon">🔄</span>
        <span>{translate("npc.editor.reload")}</span>
      </button>
      <button
        type="button"
        class="editor-icon-button"
        onclick={handleChangeDirectory}
        title={translate("npc.editor.changeDirTitle")}
      >
        <span class="btn-icon">📁</span>
        <span>{translate("npc.editor.changeDir")}</span>
      </button>
      <button
        type="button"
        class="editor-icon-button"
        onclick={() => (showSyncModal = true)}
        title={translate("npc.editor.syncShopTitle")}
      >
        <span class="btn-icon">🛍️</span>
        <span>{translate("npc.editor.syncShop")}</span>
      </button>
    </div>
  </header>

  <div class="monster-editor-main">
    {#if isInitializing}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>{translate("npc.editor.loadingSprites")}</p>
      </div>
    {:else if initError}
      <div class="error-state">
        <p class="error">{initError}</p>
        <button class="btn-primary" onclick={() => window.location.reload()}
          >{translate("npc.editor.retry")}</button
        >
      </div>
    {:else}
      <NpcSidebar />
      <NpcForm />
    {/if}
  </div>
</div>

<SyncShopModal bind:isOpen={showSyncModal} />
