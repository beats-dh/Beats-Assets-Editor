<script lang="ts">
  import { settingsState } from "../../stores/settingsState.svelte";
  import {
    perfConfig,
    PERF_DEFAULTS,
    resetPerfConfig,
  } from "../../stores/performanceConfig.svelte";
  import { debugCache } from "../../spriteCache";
  import { showStatus } from "../../utils";
  import {
    translate,
    getThemeLabel,
    getLanguageOptionLabel,
    SUPPORTED_LANGUAGES,
  } from "../../i18n";
  import { clearPreviewSpriteCaches } from "../../utils/spriteLoading";
  import { loadAssetsData } from "../../services/assetService";

  const SUPPORTED_THEMES = [
    "default",
    "ocean",
    "aurora",
    "ember",
    "forest",
    "dusk",
  ];

  interface Props {
    show: boolean;
    closeMenu: () => void;
  }
  let { show, closeMenu }: Props = $props();

  function setTheme(newTheme: string) {
    settingsState.theme = newTheme;
    showStatus(
      translate("status.themeApplied", {
        theme: getThemeLabel(newTheme as any),
      }),
      "success",
    );
  }

  function setLanguage(newLang: string) {
    settingsState.language = newLang;
    showStatus(
      translate("status.languageUpdated", {
        language: getLanguageOptionLabel(newLang as any),
      }),
      "success",
    );
  }

  async function clearCache() {
    await debugCache.clearAllCaches();
    clearPreviewSpriteCaches();
    showStatus(translate("status.cacheCleared"), "success");
    loadAssetsData();
    closeMenu();
  }

  let autoAnimate = $state(
    localStorage.getItem("autoAnimateGridEnabled") === "true",
  );
  function toggleAutoAnimate() {
    autoAnimate = !autoAnimate;
    localStorage.setItem("autoAnimateGridEnabled", String(autoAnimate));
  }

  function handleResetPerf() {
    resetPerfConfig();
    showStatus(translate("status.perfReset"), "success");
  }

  function stopPropagation(e: Event) {
    e.stopPropagation();
  }

  // Config definitions for the UI
  const perfFields = [
    {
      key: "appearanceCacheMax",
      label: translate("settings.perf.appearanceCacheMax"),
      group: "cache",
      min: 10,
      max: 10000,
    },
    {
      key: "chunkSize",
      label: translate("settings.perf.chunkSize"),
      group: "cache",
      min: 10,
      max: 1000,
    },
    {
      key: "maxPreviewCacheSize",
      label: translate("settings.perf.maxPreviewCacheSize"),
      group: "cache",
      min: 50,
      max: 5000,
    },
    {
      key: "initialSpriteRenderCount",
      label: translate("settings.perf.initialSpriteRenderCount"),
      group: "rendering",
      min: 8,
      max: 200,
    },
    {
      key: "spriteRenderChunk",
      label: translate("settings.perf.spriteRenderChunk"),
      group: "rendering",
      min: 4,
      max: 100,
    },
    {
      key: "animationBatchSize",
      label: translate("settings.perf.animationBatchSize"),
      group: "rendering",
      min: 4,
      max: 100,
    },
    {
      key: "maxAutoAnimations",
      label: translate("settings.perf.maxAutoAnimations"),
      group: "rendering",
      min: 100,
      max: 50000,
    },
    {
      key: "defaultPageSize",
      label: translate("settings.perf.defaultPageSize"),
      group: "rendering",
      min: 10,
      max: 50000,
    },
    {
      key: "searchDebounceMs",
      label: translate("settings.perf.searchDebounceMs"),
      group: "timing",
      min: 50,
      max: 2000,
    },
    {
      key: "idleCallbackTimeout",
      label: translate("settings.perf.idleCallbackTimeout"),
      group: "timing",
      min: 50,
      max: 2000,
    },
    {
      key: "historyLimit",
      label: translate("settings.perf.historyLimit"),
      group: "timing",
      min: 10,
      max: 1000,
    },
  ] as const;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="settings-menu" class:show onclick={stopPropagation}>
  <div class="settings-columns">
    <div class="settings-col">
      <div class="settings-section">
        <div class="settings-section-header">
          <h4 class="settings-title">{translate("settings.language.title")}</h4>
          <p class="settings-description">
            {translate("settings.language.description")}
          </p>
        </div>
        <select
          class="settings-select"
          value={settingsState.language}
          onchange={(e) => setLanguage(e.currentTarget.value)}
        >
          {#each SUPPORTED_LANGUAGES as lang}
            <option value={lang}
              >{lang === "default"
                ? translate("language.option.default")
                : getLanguageOptionLabel(lang)}</option
            >
          {/each}
        </select>
      </div>

      <div class="menu-divider"></div>

      <div class="settings-section">
        <div class="settings-section-header">
          <h4 class="settings-title">{translate("settings.theme.title")}</h4>
          <p class="settings-description">
            {translate("settings.theme.description")}
          </p>
        </div>
        <div class="theme-grid">
          {#each SUPPORTED_THEMES as t}
            <button
              class="theme-option"
              type="button"
              class:active={settingsState.theme === t}
              data-theme={t}
              onclick={() => setTheme(t)}
            >
              <span class="theme-name">{translate(`theme.${t}` as any)}</span>
              <span class="theme-preview">
                {#if t === "default"}
                  <span class="color-swatch" style="background: #4f46e5;"
                  ></span>
                  <span class="color-swatch" style="background: #7c3aed;"
                  ></span>
                  <span class="color-swatch" style="background: #10b981;"
                  ></span>
                {:else if t === "ocean"}
                  <span class="color-swatch" style="background: #0ea5e9;"
                  ></span>
                  <span class="color-swatch" style="background: #22d3ee;"
                  ></span>
                  <span class="color-swatch" style="background: #1abc9c;"
                  ></span>
                {:else if t === "aurora"}
                  <span class="color-swatch" style="background: #8b5cf6;"
                  ></span>
                  <span class="color-swatch" style="background: #ec4899;"
                  ></span>
                  <span class="color-swatch" style="background: #2c2555;"
                  ></span>
                {:else if t === "ember"}
                  <span class="color-swatch" style="background: #f97316;"
                  ></span>
                  <span class="color-swatch" style="background: #f43f5e;"
                  ></span>
                  <span class="color-swatch" style="background: #3a2218;"
                  ></span>
                {:else if t === "forest"}
                  <span class="color-swatch" style="background: #22c55e;"
                  ></span>
                  <span class="color-swatch" style="background: #14b8a6;"
                  ></span>
                  <span class="color-swatch" style="background: #1d3f27;"
                  ></span>
                {:else if t === "dusk"}
                  <span class="color-swatch" style="background: #f59e0b;"
                  ></span>
                  <span class="color-swatch" style="background: #38bdf8;"
                  ></span>
                  <span class="color-swatch" style="background: #2b3045;"
                  ></span>
                {/if}
              </span>
            </button>
          {/each}
        </div>
      </div>

      <div class="menu-divider"></div>

      <div class="settings-section">
        <h4 class="settings-title">
          {translate("settings.preferences.title")}
        </h4>
        <div class="settings-item">
          <label>
            <input
              type="checkbox"
              checked={autoAnimate}
              onchange={toggleAutoAnimate}
            />
            <span>{translate("settings.preferences.autoAnimate")}</span>
          </label>
        </div>
        <button class="menu-btn" onclick={clearCache}
          >{translate("settings.preferences.clearCache")}</button
        >
      </div>
    </div>

    <div class="col-divider"></div>

    <div class="settings-col perf-col">
      <div class="settings-section">
        <div class="settings-section-header">
          <h4 class="settings-title">{translate("settings.perf.title")}</h4>
          <p class="settings-description">
            {translate("settings.perf.description")}
          </p>
        </div>

        <div class="perf-group">
          <span class="perf-group-label"
            >{translate("settings.perf.group.cache")}</span
          >
          {#each perfFields.filter((f) => f.group === "cache") as field}
            <div class="perf-row">
              <label class="perf-label" for="perf-{field.key}"
                >{field.label}</label
              >
              <input
                id="perf-{field.key}"
                class="perf-input"
                type="number"
                min={field.min}
                max={field.max}
                value={perfConfig[field.key]}
                onchange={(e) => {
                  (perfConfig as any)[field.key] = Math.max(
                    field.min,
                    Math.min(
                      field.max,
                      parseInt(e.currentTarget.value) ||
                        PERF_DEFAULTS[field.key],
                    ),
                  );
                }}
              />
              <span
                class="perf-default"
                title="{translate('settings.perf.default')}: {PERF_DEFAULTS[
                  field.key
                ]}">({PERF_DEFAULTS[field.key]})</span
              >
            </div>
          {/each}
        </div>

        <div class="perf-group">
          <span class="perf-group-label"
            >{translate("settings.perf.group.rendering")}</span
          >
          {#each perfFields.filter((f) => f.group === "rendering") as field}
            <div class="perf-row">
              <label class="perf-label" for="perf-{field.key}"
                >{field.label}</label
              >
              <input
                id="perf-{field.key}"
                class="perf-input"
                type="number"
                min={field.min}
                max={field.max}
                value={perfConfig[field.key]}
                onchange={(e) => {
                  (perfConfig as any)[field.key] = Math.max(
                    field.min,
                    Math.min(
                      field.max,
                      parseInt(e.currentTarget.value) ||
                        PERF_DEFAULTS[field.key],
                    ),
                  );
                }}
              />
              <span
                class="perf-default"
                title="{translate('settings.perf.default')}: {PERF_DEFAULTS[
                  field.key
                ]}">({PERF_DEFAULTS[field.key]})</span
              >
            </div>
          {/each}
        </div>

        <div class="perf-group">
          <span class="perf-group-label"
            >{translate("settings.perf.group.timing")}</span
          >
          {#each perfFields.filter((f) => f.group === "timing") as field}
            <div class="perf-row">
              <label class="perf-label" for="perf-{field.key}"
                >{field.label}</label
              >
              <input
                id="perf-{field.key}"
                class="perf-input"
                type="number"
                min={field.min}
                max={field.max}
                value={perfConfig[field.key]}
                onchange={(e) => {
                  (perfConfig as any)[field.key] = Math.max(
                    field.min,
                    Math.min(
                      field.max,
                      parseInt(e.currentTarget.value) ||
                        PERF_DEFAULTS[field.key],
                    ),
                  );
                }}
              />
              <span
                class="perf-default"
                title="{translate('settings.perf.default')}: {PERF_DEFAULTS[
                  field.key
                ]}">({PERF_DEFAULTS[field.key]})</span
              >
            </div>
          {/each}
        </div>

        <button class="menu-btn reset-btn" onclick={handleResetPerf}
          >{translate("settings.perf.resetBtn")}</button
        >
      </div>
    </div>
  </div>
</div>

<style>
  .settings-columns {
    display: flex;
    gap: 0;
    align-items: stretch;
  }
  .settings-col {
    flex: 1;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 12px);
  }
  .perf-col {
    min-width: 260px;
  }
  .col-divider {
    width: 1px;
    background: var(--border-color, #333);
    opacity: 0.4;
    margin: 0 var(--space-md, 12px);
    flex-shrink: 0;
  }
  .perf-group {
    margin-bottom: 10px;
  }
  .perf-group-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--primary-accent, #818cf8);
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(129, 140, 248, 0.15);
  }
  .perf-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
  }
  .perf-label {
    flex: 1;
    font-size: 12px;
    color: var(--text-primary, #e2e8f0);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .perf-input {
    width: 80px;
    padding: 4px 6px;
    font-size: 12px;
    font-weight: 500;
    text-align: right;
    border: 1px solid var(--border-soft, #334155);
    border-radius: 6px;
    background: rgba(15, 23, 42, 0.6);
    color: var(--text-primary, #e2e8f0);
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .perf-input::-webkit-inner-spin-button,
  .perf-input::-webkit-outer-spin-button {
    opacity: 1;
    height: 14px;
    width: 12px;
    margin-left: 4px;
    cursor: pointer;
  }
  .perf-input:hover {
    border-color: var(--border-hover, #475569);
  }
  .perf-input:focus {
    outline: none;
    border-color: var(--primary-accent, #818cf8);
    box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.2);
  }
  .perf-default {
    font-size: 10px;
    color: var(--text-muted, #64748b);
    min-width: 44px;
    font-style: italic;
  }
  .reset-btn {
    margin-top: 10px;
    width: 100%;
  }
</style>
