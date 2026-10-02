<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount } from "svelte";
  import { COMMANDS } from "../../commands";
  import { assetsState } from "../../stores/assetsState.svelte";
  import { appState } from "../../stores/appState.svelte";
  import { openConfirmModal } from "../../stores/confirmState.svelte";
  import { translate } from "../../i18n";
  import { showStatus } from "../../utils";
  import type { ClientUrls, ClientUrlEntry, BattleEyeInfo, RsaInfo } from "../../types";

  // ── URLs ────────────────────────────────────────────────────────────────
  let configPath = $state("");
  let urls = $state<ClientUrlEntry[]>([]);
  let urlsLoaded = $state(false);
  let savingUrls = $state(false);

  // Keys whose value carries a runtime-appended payload (documented below).
  const PAYLOAD_KEYS: Record<string, string> = {
    loginWebService: "payload.login",
    clientWebService: "payload.login",
    tibiaStoreGetCoinsUrl: "payload.store",
    getPremiumUrl: "payload.store",
    wheelOfDestinyPlannerDirectUrl: "payload.wheel",
    limesurveyUrl: "payload.survey",
    crashReportUrl: "payload.crash",
    fpsHistoryRecipient: "payload.fps",
  };

  // ── BattleEye ───────────────────────────────────────────────────────────
  let be = $state<BattleEyeInfo | null>(null);
  let beLoading = $state(false);
  let beBusy = $state(false);

  // ── RSA ─────────────────────────────────────────────────────────────────
  let rsa = $state<RsaInfo | null>(null);
  let rsaLoading = $state(false);
  let rsaBusy = $state(false);
  let newModulus = $state("");

  // A 1024-bit modulus is 256 hex chars once whitespace is stripped.
  let modulusHexLen = $derived(newModulus.replace(/\s+/g, "").length);
  let modulusValid = $derived(
    modulusHexLen > 0 && modulusHexLen <= 256 && /^[0-9a-fA-F\s]+$/.test(newModulus),
  );

  async function loadUrls() {
    if (!appState.tibiaPath) {
      showStatus(translate("clientcfg.noPath"), "error");
      return;
    }
    try {
      const res = await invoke<ClientUrls>(COMMANDS.GET_CLIENT_URLS, {
        tibiaPath: appState.tibiaPath,
      });
      configPath = res.configPath;
      urls = res.entries;
      urlsLoaded = true;
    } catch (e) {
      showStatus(translate("clientcfg.urls.loadErr", { err: String(e) }), "error");
    }
  }

  async function saveUrls() {
    if (!appState.tibiaPath) return;
    savingUrls = true;
    try {
      await invoke(COMMANDS.SAVE_CLIENT_URLS, {
        tibiaPath: appState.tibiaPath,
        entries: urls.map((u) => ({ key: u.key, value: u.value.trim() })),
      });
      showStatus(translate("clientcfg.urls.saved"), "success");
    } catch (e) {
      showStatus(translate("clientcfg.urls.saveErr", { err: String(e) }), "error");
    } finally {
      savingUrls = false;
    }
  }

  async function loadBattleEye() {
    if (!appState.tibiaPath) return;
    beLoading = true;
    try {
      be = await invoke<BattleEyeInfo>(COMMANDS.GET_BATTLEYE_STATUS, {
        tibiaPath: appState.tibiaPath,
      });
    } catch (e) {
      be = null;
      showStatus(translate("clientcfg.be.loadErr", { err: String(e) }), "error");
    } finally {
      beLoading = false;
    }
  }

  async function toggleBattleEye(enable: boolean) {
    if (!be?.exePath) return;
    const ok = await openConfirmModal(
      enable
        ? translate("clientcfg.be.confirmEnable", { exe: be.exePath })
        : translate("clientcfg.be.confirmDisable", { exe: be.exePath }),
      translate("clientcfg.be.confirmTitle"),
    );
    if (!ok) return;
    beBusy = true;
    try {
      await invoke(COMMANDS.SET_BATTLEYE_ENABLED, {
        exePath: be.exePath,
        enabled: enable,
      });
      showStatus(
        enable ? translate("clientcfg.be.enabled") : translate("clientcfg.be.disabled"),
        "success",
      );
      await loadBattleEye();
    } catch (e) {
      showStatus(translate("clientcfg.be.patchErr", { err: String(e) }), "error");
    } finally {
      beBusy = false;
    }
  }

  async function loadRsa() {
    if (!appState.tibiaPath) return;
    rsaLoading = true;
    try {
      rsa = await invoke<RsaInfo>(COMMANDS.GET_RSA_MODULUS, {
        tibiaPath: appState.tibiaPath,
      });
    } catch (e) {
      rsa = null;
      showStatus(translate("clientcfg.rsa.loadErr", { err: String(e) }), "error");
    } finally {
      rsaLoading = false;
    }
  }

  async function saveRsa() {
    if (!rsa?.exePath || !modulusValid) return;
    const ok = await openConfirmModal(
      translate("clientcfg.rsa.confirm", { exe: rsa.exePath }),
      translate("clientcfg.rsa.confirmTitle"),
    );
    if (!ok) return;
    rsaBusy = true;
    try {
      await invoke(COMMANDS.SET_RSA_MODULUS, {
        exePath: rsa.exePath,
        modulus: newModulus,
      });
      showStatus(translate("clientcfg.rsa.saved"), "success");
      newModulus = "";
      await loadRsa();
    } catch (e) {
      showStatus(translate("clientcfg.rsa.saveErr", { err: String(e) }), "error");
    } finally {
      rsaBusy = false;
    }
  }

  onMount(() => {
    loadUrls();
    loadBattleEye();
    loadRsa();
  });

  function goBack() {
    assetsState.viewMode = "categories";
  }
</script>

<div class="client-config">
  <header class="cc-header">
    <button class="modern-back-btn" onclick={goBack}>
      ← {translate("browser.static.back")}
    </button>
    <h2>⚙️ {translate("clientcfg.title")}</h2>
  </header>

  <!-- ── URLs ─────────────────────────────────────────────────────── -->
  <section class="cc-section">
    <div class="cc-section-head">
      <h3>🔗 {translate("clientcfg.urls.title")}</h3>
      <div class="cc-actions">
        <button class="cc-btn" onclick={loadUrls}>{translate("clientcfg.reload")}</button>
        <button class="cc-btn primary" disabled={!urlsLoaded || savingUrls} onclick={saveUrls}>
          {savingUrls ? translate("clientcfg.saving") : translate("clientcfg.save")}
        </button>
      </div>
    </div>

    {#if configPath}
      <p class="cc-path">{configPath}</p>
    {/if}

    {#if urls.length === 0}
      <p class="cc-empty">{translate("clientcfg.urls.empty")}</p>
    {:else}
      <div class="cc-url-list">
        {#each urls as entry (entry.key)}
          <div class="cc-url-row">
            <label class="cc-url-key" for={`url-${entry.key}`}>
              {entry.key}
              {#if PAYLOAD_KEYS[entry.key]}
                <span class="cc-badge" title={translate(PAYLOAD_KEYS[entry.key])}>payload</span>
              {/if}
            </label>
            <input
              id={`url-${entry.key}`}
              class="cc-input"
              bind:value={entry.value}
              spellcheck="false"
            />
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- ── Payload reference ────────────────────────────────────────── -->
  <section class="cc-section">
    <h3>🧩 {translate("clientcfg.payloads.title")}</h3>
    <p class="cc-help">{translate("clientcfg.payloads.help")}</p>
    <ul class="cc-payloads">
      <li><code>loginWebService</code> — {translate("payload.login")}</li>
      <li><code>tibiaStoreGetCoinsUrl</code> — {translate("payload.store")}</li>
      <li><code>wheelOfDestinyPlannerDirectUrl</code> — {translate("payload.wheel")}</li>
      <li><code>limesurveyUrl</code> — {translate("payload.survey")}</li>
      <li><code>crashReportUrl</code> / <code>fpsHistoryRecipient</code> — {translate("payload.crash")}</li>
    </ul>
  </section>

  <!-- ── BattleEye ────────────────────────────────────────────────── -->
  <section class="cc-section">
    <div class="cc-section-head">
      <h3>🛡️ {translate("clientcfg.be.title")}</h3>
      <button class="cc-btn" disabled={beLoading} onclick={loadBattleEye}>
        {translate("clientcfg.reload")}
      </button>
    </div>

    {#if beLoading}
      <p class="cc-empty">{translate("clientcfg.be.scanning")}</p>
    {:else if !be || !be.status.found}
      <p class="cc-empty">{translate("clientcfg.be.notFound")}</p>
      {#if be && be.scanned.length}
        <p class="cc-path">{translate("clientcfg.be.scanned")}: {be.scanned.join(", ")}</p>
      {/if}
    {:else}
      <p class="cc-path">{be.exePath}</p>
      <div class="cc-be-status">
        <span class="cc-be-dot" class:on={be.status.enabled} class:off={!be.status.enabled}></span>
        <span class="cc-be-label">
          {be.status.enabled ? translate("clientcfg.be.active") : translate("clientcfg.be.inactive")}
        </span>
        {#if be.status.offset != null}
          <span class="cc-be-off">0x{be.status.offset.toString(16)}</span>
        {/if}
      </div>
      <div class="cc-actions">
        <button
          class="cc-btn primary"
          disabled={beBusy || !be.status.enabled}
          onclick={() => toggleBattleEye(false)}
        >
          {translate("clientcfg.be.disable")}
        </button>
        <button
          class="cc-btn"
          disabled={beBusy || be.status.enabled === true}
          onclick={() => toggleBattleEye(true)}
        >
          {translate("clientcfg.be.enable")}
        </button>
      </div>
      <p class="cc-help">{translate("clientcfg.be.note")}</p>
    {/if}
  </section>

  <!-- ── RSA ──────────────────────────────────────────────────────── -->
  <section class="cc-section">
    <div class="cc-section-head">
      <h3>🔑 {translate("clientcfg.rsa.title")}</h3>
      <button class="cc-btn" disabled={rsaLoading} onclick={loadRsa}>
        {translate("clientcfg.reload")}
      </button>
    </div>

    {#if rsaLoading}
      <p class="cc-empty">{translate("clientcfg.rsa.scanning")}</p>
    {:else if !rsa || !rsa.status.found}
      <p class="cc-empty">{translate("clientcfg.rsa.notFound")}</p>
    {:else}
      <p class="cc-path">{rsa.exePath}</p>
      <div class="cc-rsa-current">
        <span class="cc-rsa-tag" class:ot={rsa.status.isOtDefault}>
          {rsa.status.isOtDefault ? translate("clientcfg.rsa.isOt") : translate("clientcfg.rsa.isCustom")}
        </span>
        <textarea class="cc-mod" readonly rows="3">{rsa.status.modulus}</textarea>
      </div>

      <label class="cc-rsa-label" for="cc-new-mod">{translate("clientcfg.rsa.newLabel")}</label>
      <textarea
        id="cc-new-mod"
        class="cc-mod"
        rows="3"
        placeholder={translate("clientcfg.rsa.placeholder")}
        bind:value={newModulus}
        spellcheck="false"
      ></textarea>
      <div class="cc-rsa-foot">
        <span class="cc-rsa-count" class:bad={newModulus.length > 0 && !modulusValid}>
          {modulusHexLen}/256 hex
        </span>
        <button
          class="cc-btn primary"
          disabled={rsaBusy || !modulusValid}
          onclick={saveRsa}
        >
          {rsaBusy ? translate("clientcfg.saving") : translate("clientcfg.rsa.apply")}
        </button>
      </div>
      <p class="cc-help">{translate("clientcfg.rsa.note")}</p>
    {/if}
  </section>
</div>

<style>
  .client-config {
    padding: 1.5rem;
    max-width: 900px;
    margin: 0 auto;
    color: var(--text-primary);
  }
  .cc-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .cc-header h2 {
    margin: 0;
    font-size: 1.4rem;
  }
  .cc-section {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }
  .cc-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }
  .cc-section h3 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
  }
  .cc-path {
    font-size: 0.8rem;
    color: var(--text-secondary);
    word-break: break-all;
    margin: 0 0 0.75rem;
  }
  .cc-help {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin: 0.5rem 0;
  }
  .cc-empty {
    color: var(--text-secondary);
    font-style: italic;
  }
  .cc-url-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .cc-url-row {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) 2fr;
    gap: 0.75rem;
    align-items: center;
  }
  .cc-url-key {
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    word-break: break-word;
  }
  .cc-badge {
    font-size: 0.65rem;
    background: var(--accent-color, #6a5acd);
    color: #fff;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    cursor: help;
  }
  .cc-input {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.4rem 0.6rem;
    color: var(--text-primary);
    font-family: monospace;
    font-size: 0.85rem;
  }
  .cc-actions {
    display: flex;
    gap: 0.5rem;
  }
  .cc-btn {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.4rem 0.9rem;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 0.85rem;
  }
  .cc-btn:hover:not(:disabled) {
    border-color: var(--accent-color, #6a5acd);
  }
  .cc-btn.primary {
    background: var(--accent-color, #6a5acd);
    color: #fff;
    border-color: transparent;
  }
  .cc-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .cc-payloads {
    margin: 0.5rem 0 0;
    padding-left: 1.2rem;
    font-size: 0.85rem;
    line-height: 1.7;
  }
  .cc-payloads code {
    background: var(--bg-primary);
    padding: 0.05rem 0.3rem;
    border-radius: 4px;
  }
  .cc-be-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.5rem 0 0.75rem;
  }
  .cc-be-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .cc-be-dot.on {
    background: #e0524f;
  }
  .cc-be-dot.off {
    background: #4caf50;
  }
  .cc-be-label {
    font-weight: 600;
  }
  .cc-be-off {
    font-family: monospace;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  .cc-mod {
    width: 100%;
    box-sizing: border-box;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.5rem;
    color: var(--text-primary);
    font-family: monospace;
    font-size: 0.75rem;
    word-break: break-all;
    resize: vertical;
  }
  .cc-rsa-current {
    margin-bottom: 0.75rem;
  }
  .cc-rsa-tag {
    display: inline-block;
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    margin-bottom: 0.35rem;
    background: var(--border-color);
    color: var(--text-primary);
  }
  .cc-rsa-tag.ot {
    background: #4caf50;
    color: #fff;
  }
  .cc-rsa-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0.5rem 0 0.3rem;
  }
  .cc-rsa-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.5rem;
  }
  .cc-rsa-count {
    font-family: monospace;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  .cc-rsa-count.bad {
    color: #e0524f;
  }
</style>
