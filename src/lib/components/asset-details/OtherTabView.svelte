<script lang="ts">
  import { invoke } from "../../../utils/invoke";
  import { COMMANDS } from "../../../commands";
  import { translate } from "../../../i18n";

  interface Props {
    category: string;
    id: number;
  }
  let { category, id }: Props = $props();

  let dump = $state("");
  let loading = $state(false);
  let error = $state("");

  $effect(() => {
    const cat = category;
    const itemId = id;
    loading = true;
    error = "";
    invoke<string>(COMMANDS.GET_APPEARANCE_RAW_DUMP, {
      category: cat,
      id: itemId,
    })
      .then((res) => {
        dump = res;
      })
      .catch((e) => {
        error = String(e);
      })
      .finally(() => {
        loading = false;
      });
  });
</script>

<div class="detail-section">
  <h4>{translate("modal.other.title")}</h4>
  {#if loading}
    <p class="other-tab-status">{translate("modal.other.loading")}</p>
  {:else if error}
    <p class="other-tab-status other-tab-error">{error}</p>
  {:else}
    <textarea class="other-tab-dump" readonly>{dump}</textarea>
  {/if}
</div>

<style>
  .other-tab-status {
    color: var(--text-muted);
    font-size: 13px;
  }
  .other-tab-error {
    color: var(--error-color);
  }
  .other-tab-dump {
    width: 100%;
    min-height: 360px;
    resize: vertical;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-secondary);
    background: var(--primary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 12px;
    white-space: pre;
    overflow: auto;
  }
</style>
