<script lang="ts">
  import "./app.css";
  import AppLauncher from "./lib/components/AppLauncher.svelte";
  import AssetsEditorView from "./lib/components/AssetsEditorView.svelte";
  import { appState } from "./lib/stores/app.svelte";

  // Reactive state for current view
  let isLoaded = $derived(appState.isLoaded);
</script>

{#if !isLoaded}
  <AppLauncher />
{:else}
  <AssetsEditorView />
{/if}
