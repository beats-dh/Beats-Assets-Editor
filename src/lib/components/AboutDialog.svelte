<script lang="ts">
  import { onMount } from "svelte";
  import { translate } from "../../i18n";
  import { getName, getVersion } from "@tauri-apps/api/app";
  import ModalShell from "./ModalShell.svelte";

  interface Props {
    show: boolean;
    closeDialog: () => void;
  }
  let { show, closeDialog }: Props = $props();

  let appName = $state("Canary Studio");
  let appVersion = $state("");

  onMount(async () => {
    try {
      appName = await getName();
      appVersion = await getVersion();
    } catch (_) {
      // Running outside the Tauri runtime (e.g. plain `vite dev`).
    }
  });
</script>

<ModalShell
  {show}
  title={translate("about.title")}
  onClose={closeDialog}
  maxWidth="420px"
>
  <div class="about-body">
    <div class="about-logo">⚔️</div>
    <h3 class="about-name">{appName}</h3>
    <p class="about-version">{translate("about.version")} {appVersion}</p>
    <p class="about-description">{translate("about.description")}</p>
  </div>
  {#snippet footer()}
    <button class="btn-secondary" onclick={closeDialog}
      >{translate("about.close")}</button
    >
  {/snippet}
</ModalShell>

<style>
  .about-body {
    text-align: center;
    color: var(--text-secondary);
  }
  .about-logo {
    font-size: 48px;
    line-height: 1;
    margin-bottom: var(--space-sm);
  }
  .about-name {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .about-version {
    margin: 4px 0 12px;
    font-size: 13px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }
  .about-description {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
  }
</style>
