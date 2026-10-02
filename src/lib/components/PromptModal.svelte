<script lang="ts">
  import { translate } from "../../i18n";
  import { promptState, closePrompt } from "../../stores/promptState.svelte";
  import ModalShell from "./ModalShell.svelte";

  let value = $state("");
  let inputEl = $state<HTMLInputElement | undefined>();

  // Reset the field and focus it whenever a new prompt opens.
  $effect(() => {
    if (promptState.options) {
      value = promptState.options.defaultValue ?? "";
      requestAnimationFrame(() => inputEl?.focus());
    }
  });

  function submit() {
    closePrompt(value);
  }
  function cancel() {
    closePrompt(null);
  }
</script>

<ModalShell
  show={!!promptState.options}
  title={promptState.options?.title ?? ""}
  onClose={cancel}
  maxWidth="460px"
>
  {#if promptState.options?.message}
    <p class="prompt-message">{promptState.options.message}</p>
  {/if}
  <input
    bind:this={inputEl}
    class="prompt-input"
    type="text"
    bind:value
    placeholder={promptState.options?.placeholder ?? ""}
    onkeydown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    }}
  />
  {#snippet footer()}
    <button class="btn-primary" onclick={submit}>
      {promptState.options?.confirmLabel ?? translate("modal.btn.confirm")}
    </button>
    <button class="btn-secondary" onclick={cancel}>
      {promptState.options?.cancelLabel ?? translate("modal.btn.cancel")}
    </button>
  {/snippet}
</ModalShell>

<style>
  .prompt-message {
    margin: 0 0 10px;
    font-size: 13px;
    color: var(--text-secondary);
  }
  .prompt-input {
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    background: var(--primary-bg);
    color: var(--text-primary);
    font-size: 14px;
  }
  .prompt-input:focus {
    outline: none;
    border-color: var(--primary-accent);
  }
</style>
