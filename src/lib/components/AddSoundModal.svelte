<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { open as openDialog } from "@tauri-apps/plugin-dialog";
  import { translate } from "../../i18n";
  import {
    getAllSounds,
    refreshSounds,
    getSoundAudioData,
    addNumericSoundEffect,
    importAndAddSound,
    type SoundInfo,
  } from "../../services/soundService";
  import { SOUND_TYPES } from "../../soundTypes";

  // Props
  interface Props {
    isOpen?: boolean;
    onClose: () => void;
    onSoundCreated?: ((id: number) => void) | undefined;
  }
  let { isOpen = false, onClose, onSoundCreated = undefined }: Props = $props();

  // State
  let mode = $state<"simple" | "random">("simple");
  let soundType = $state("Unknown");
  let soundId = $state("");
  let randomIds = $state("");
  let selectedIds = $state<number[]>([]);

  // Pitch and Volume
  let pitchMin = $state("");
  let pitchMax = $state("");
  let volumeMin = $state("");
  let volumeMax = $state("");

  // Sound picker
  let allSounds = $state<SoundInfo[]>([]);
  let searchFilter = $state("");
  let loading = $state(false);
  let error = $state("");

  // Audio playback
  let currentAudio = $state<HTMLAudioElement | null>(null);
  let isPlaying = $state(false);
  let _playingSequence = $state(false);
  let sequenceAbort = $state(false);

  // Upload section
  let selectedFilePath = $state<string | null>(null);
  let uploadId = $state("");
  let isStream = $state(false);
  let uploading = $state(false);

  const typeOptions = SOUND_TYPES || [
    "Unknown",
    "Spell Attack",
    "Spell Healing",
    "Spell Support",
    "Weapon Attack",
    "Creature Noise",
    "Creature Death",
    "Creature Attack",
    "Ambience Stream",
    "Food and Drink",
    "Item Movement",
    "Event",
    "UI",
    "Whisper",
    "Chat Message",
    "Party",
    "VIP List",
    "Raid Announcement",
    "Server Message",
    "Spell Generic",
  ];

  // Filtered sounds
  let filteredSounds = $derived.by(() => {
    const f = searchFilter.trim().toLowerCase();
    if (!f) return allSounds;
    return allSounds.filter(
      (s) =>
        String(s.id).includes(f) ||
        (s.filename || "").toLowerCase().includes(f),
    );
  });

  onMount(async () => {
    if (isOpen) {
      await loadSounds();
    }
  });

  onDestroy(() => {
    stopAudio();
  });

  async function loadSounds() {
    loading = true;
    try {
      allSounds = await getAllSounds();
    } catch (e) {
      console.error("Failed to load sounds:", e);
    } finally {
      loading = false;
    }
  }

  function stopAudio() {
    if (currentAudio) {
      try {
        currentAudio.pause();
      } catch {}
      currentAudio.src = "";
      currentAudio = null;
    }
    isPlaying = false;
    _playingSequence = false;
    sequenceAbort = true;
  }

  async function playSingle(id: number) {
    sequenceAbort = true;
    stopAudio();
    try {
      const audioData = await getSoundAudioData(id);
      const audio = new Audio(`data:audio/ogg;base64,${audioData}`);
      currentAudio = audio;
      isPlaying = true;
      audio.addEventListener("ended", () => stopAudio());
      audio.addEventListener("error", () => stopAudio());
      await audio.play();
    } catch (e) {
      console.error("Failed to play sound:", id, e);
      stopAudio();
    }
  }

  async function playSequence(ids: number[]) {
    if (!ids || ids.length === 0) return;
    sequenceAbort = false;
    _playingSequence = true;
    isPlaying = true;
    stopAudio();
    for (let i = 0; i < ids.length; i++) {
      if (sequenceAbort) break;
      try {
        const audioData = await getSoundAudioData(ids[i]);
        const audio = new Audio(`data:audio/ogg;base64,${audioData}`);
        currentAudio = audio;
        await new Promise<void>((resolve) => {
          audio.addEventListener("ended", () => resolve(), { once: true });
          audio.addEventListener("error", () => resolve(), { once: true });
          audio.play().catch(() => resolve());
        });
      } catch (e) {
        console.error("Failed to play sound in sequence:", ids[i], e);
      }
    }
    stopAudio();
  }

  function togglePlaySelected() {
    if (isPlaying) {
      stopAudio();
      return;
    }
    if (mode === "random") {
      playSequence([...selectedIds]);
    } else if (soundId) {
      const id = parseInt(soundId, 10);
      if (!isNaN(id)) playSingle(id);
    }
  }

  function selectSound(id: number) {
    if (mode === "simple") {
      selectedIds = [id];
      soundId = String(id);
    } else {
      if (!selectedIds.includes(id)) {
        selectedIds = [...selectedIds, id];
      }
      randomIds = selectedIds.join(",");
    }
  }

  function removeSelected(id: number) {
    selectedIds = selectedIds.filter((x) => x !== id);
    if (mode === "random") {
      randomIds = selectedIds.join(",");
    } else {
      soundId = selectedIds[0] ? String(selectedIds[0]) : "";
    }
  }

  function clearSelection() {
    selectedIds = [];
    soundId = "";
    randomIds = "";
  }

  function handleModeChange(newMode: "simple" | "random") {
    mode = newMode;
    clearSelection();
  }

  async function selectFile() {
    try {
      const file = await openDialog({
        multiple: false,
        filters: [{ name: "Audio", extensions: ["ogg"] }],
      });
      if (typeof file === "string" && file.length > 0) {
        selectedFilePath = file;
        error = "";
        const ext = (file.split(".").pop() || "").toLowerCase();
        if (ext !== "ogg") {
          error = translate("modal.audio.error.format");
          selectedFilePath = null;
        }
      }
    } catch (e) {
      console.error("Failed to select file:", e);
    }
  }

  async function handleImportAndAdd() {
    if (!selectedFilePath) {
      error = translate("modal.audio.error.select");
      return;
    }
    uploading = true;
    error = "";
    try {
      const idVal = uploadId ? Number(uploadId) : undefined;
      const created = await importAndAddSound(
        selectedFilePath,
        undefined,
        isStream,
        idVal,
      );
      allSounds = await refreshSounds();
      if (created && typeof created.id === "number") {
        selectSound(created.id);
      }
      selectedFilePath = null;
      uploadId = "";
      isStream = false;
    } catch (e) {
      console.error("Failed to import sound:", e);
      error = translate("modal.audio.error.import", { err: String(e) });
    } finally {
      uploading = false;
    }
  }

  async function handleSave() {
    error = "";
    try {
      const parsedRandomIds = randomIds
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => Number(s));
      const info: any = {
        id: 0,
        sound_type: soundType,
        sound_id: undefined,
        random_sound_ids: undefined,
        random_pitch_min: pitchMin ? Number(pitchMin) : undefined,
        random_pitch_max: pitchMax ? Number(pitchMax) : undefined,
        random_volume_min: volumeMin ? Number(volumeMin) : undefined,
        random_volume_max: volumeMax ? Number(volumeMax) : undefined,
      };
      if (mode === "simple") {
        info.sound_id = soundId ? Number(soundId) : undefined;
        info.random_sound_ids = [];
      } else {
        info.sound_id = undefined;
        info.random_sound_ids = parsedRandomIds;
      }
      const newId = await addNumericSoundEffect(info);
      if (onSoundCreated) onSoundCreated(newId);
      handleClose();
    } catch (e) {
      console.error("Failed to add sound effect:", e);
      error = translate("modal.audio.error.add");
    }
  }

  function handleClose() {
    stopAudio();
    clearSelection();
    error = "";
    onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") handleClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div
    class="add-sound-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="add-sound-title"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={handleClose}></div>

    <div class="modal-content" role="document">
      <div class="modal-header">
        <h2 id="add-sound-title">{translate("modal.sound.add")}</h2>
        <button
          class="close-btn"
          type="button"
          onclick={handleClose}
          aria-label="Fechar">✕</button
        >
      </div>

      <div class="modal-body">
        {#if error}
          <div class="error-message" role="alert">{error}</div>
        {/if}

        <div class="edit-section">
          <fieldset class="radio-group">
            <legend class="sr-only">Modo de som</legend>
            <label>
              <input
                type="radio"
                name="mode"
                value="simple"
                checked={mode === "simple"}
                onchange={() => handleModeChange("simple")}
              />
              {translate("modal.sound.mode.simple")}
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                value="random"
                checked={mode === "random"}
                onchange={() => handleModeChange("random")}
              />
              {translate("modal.sound.mode.random")}
            </label>
          </fieldset>

          <div class="form-grid">
            <label>
              {translate("modal.sound.type")}
              <select class="modern-select" bind:value={soundType}>
                {#each typeOptions as t}
                  <option value={t}>{t}</option>
                {/each}
              </select>
            </label>
            {#if mode === "simple"}
              <label>
                {translate("modal.sound.id")}
                <input
                  type="number"
                  class="modern-input"
                  bind:value={soundId}
                />
              </label>
            {:else}
              <label>
                {translate("modal.sound.randomIds")}
                <input
                  type="text"
                  class="modern-input"
                  bind:value={randomIds}
                  placeholder={translate("modal.sound.randomIdsPl")}
                />
              </label>
            {/if}
          </div>

          <div class="form-grid">
            <label
              >{translate("modal.sound.pitchMin")}
              <input
                type="number"
                step="0.01"
                class="modern-input"
                bind:value={pitchMin}
              /></label
            >
            <label
              >{translate("modal.sound.pitchMax")}
              <input
                type="number"
                step="0.01"
                class="modern-input"
                bind:value={pitchMax}
              /></label
            >
          </div>
          <div class="form-grid">
            <label
              >{translate("modal.sound.volumeMin")}
              <input
                type="number"
                step="0.01"
                class="modern-input"
                bind:value={volumeMin}
              /></label
            >
            <label
              >{translate("modal.sound.volumeMax")}
              <input
                type="number"
                step="0.01"
                class="modern-input"
                bind:value={volumeMax}
              /></label
            >
          </div>

          <!-- Upload Section -->
          <div class="upload-section">
            <h4>{translate("modal.sound.import.title")}</h4>
            <div class="form-grid">
              <div class="file-select">
                <button type="button" class="btn-secondary" onclick={selectFile}
                  >{translate("modal.sound.import.btn")}</button
                >
                <span class="file-name"
                  >{selectedFilePath ||
                    translate("modal.sound.import.noFile")}</span
                >
              </div>
              <label class="checkbox-label"
                ><input type="checkbox" bind:checked={isStream} />
                {translate("modal.sound.import.strm")}</label
              >
              <label
                >{translate("modal.sound.import.id")}
                <input
                  type="number"
                  class="modern-input"
                  bind:value={uploadId}
                /></label
              >
              <button
                type="button"
                class="btn-primary"
                onclick={handleImportAndAdd}
                disabled={uploading || !selectedFilePath}
              >
                {uploading
                  ? translate("modal.sound.import.actLoad")
                  : translate("modal.sound.import.act")}
              </button>
            </div>
          </div>

          <!-- Sound Picker -->
          <div class="sound-picker">
            <div class="picker-controls">
              <input
                type="text"
                class="modern-input"
                placeholder={translate("modal.sound.search")}
                bind:value={searchFilter}
                aria-label="Buscar sons"
              />
              <div class="picker-actions">
                <button
                  type="button"
                  class="btn-secondary"
                  onclick={togglePlaySelected}
                  aria-label={isPlaying
                    ? translate("modal.sound.search.pause")
                    : translate("modal.sound.search.play")}
                >
                  {isPlaying
                    ? translate("modal.sound.search.pause")
                    : translate("modal.sound.search.play")}
                </button>
                <button
                  type="button"
                  class="btn-secondary"
                  onclick={clearSelection}
                  aria-label={translate("modal.sound.search.clr")}
                  >{translate("modal.sound.search.clr")}</button
                >
              </div>
            </div>

            {#if selectedIds.length > 0}
              <div class="selected-chips">
                {#each selectedIds as id}
                  <button
                    type="button"
                    class="chip"
                    onclick={() => removeSelected(id)}
                    aria-label={translate("modal.audio.aria.remove", { id })}
                  >
                    {id}<span class="chip-remove" aria-hidden="true">✕</span>
                  </button>
                {/each}
              </div>
            {/if}

            <div
              class="sound-list"
              role="listbox"
              aria-label={translate("modal.audio.aria.list")}
            >
              {#if loading}
                <div class="loading">{translate("modal.sound.loading")}</div>
              {:else}
                {#each filteredSounds as sound}
                  <div
                    class="sound-item"
                    class:selected={selectedIds.includes(sound.id)}
                    role="option"
                    aria-selected={selectedIds.includes(sound.id)}
                  >
                    <span class="sound-id">{sound.id}</span>
                    <span class="sound-name" title={sound.filename}
                      >{sound.filename}</span
                    >
                    <div class="sound-actions">
                      <button
                        type="button"
                        class="btn-icon"
                        onclick={() => playSingle(sound.id)}
                        aria-label={translate("modal.audio.aria.play", {
                          id: sound.id,
                        })}>▶</button
                      >
                      <button
                        type="button"
                        class="btn-icon"
                        onclick={() => selectSound(sound.id)}
                        aria-label={mode === "random"
                          ? translate("modal.audio.btn.add")
                          : translate("modal.audio.btn.select")}
                      >
                        {mode === "random" ? "+" : "✓"}
                      </button>
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-save" onclick={handleSave}
          >{translate("modal.btn.save")}</button
        >
        <button type="button" class="btn-secondary" onclick={handleClose}
          >{translate("modal.btn.cancel")}</button
        >
      </div>
    </div>
  </div>
{/if}

<style>
  .add-sound-modal {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
  }
  .modal-content {
    position: relative;
    background: var(--card-background, #1e1e2e);
    border-radius: 12px;
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color, #333);
  }
  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--text-primary, #fff);
  }
  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary, #888);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
  }
  .close-btn:hover {
    color: var(--text-primary, #fff);
  }
  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }
  .modal-footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color, #333);
  }
  .error-message {
    background: var(--error-bg, #3d1f1f);
    color: var(--error-color, #ff6b6b);
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }
  .edit-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .radio-group {
    display: flex;
    gap: 1.5rem;
    border: none;
    padding: 0;
    margin: 0;
  }
  .radio-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--text-primary, #fff);
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }
  .form-grid label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: var(--text-secondary, #aaa);
    font-size: 0.875rem;
  }
  .modern-input,
  .modern-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, #444);
    border-radius: 6px;
    background: var(--input-bg, #2a2a3e);
    color: var(--text-primary, #fff);
    font-size: 0.9rem;
  }
  .modern-input:focus,
  .modern-select:focus {
    outline: none;
    border-color: var(--accent-color, #6366f1);
  }
  .upload-section {
    background: var(--section-bg, #252535);
    padding: 1rem;
    border-radius: 8px;
    margin-top: 0.5rem;
  }
  .upload-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: var(--text-primary, #fff);
  }
  .file-select {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .file-name {
    font-size: 0.8rem;
    color: var(--text-secondary, #888);
    word-break: break-all;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary, #fff);
  }
  .sound-picker {
    margin-top: 1rem;
    border: 1px solid var(--border-color, #333);
    border-radius: 8px;
    overflow: hidden;
  }
  .picker-controls {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--section-bg, #252535);
    border-bottom: 1px solid var(--border-color, #333);
  }
  .picker-controls input {
    flex: 1;
  }
  .picker-actions {
    display: flex;
    gap: 0.5rem;
  }
  .selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--section-bg, #252535);
    border-bottom: 1px solid var(--border-color, #333);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: var(--accent-color, #6366f1);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
  }
  .chip:hover {
    background: var(--accent-hover, #5558e3);
  }
  .chip-remove {
    font-size: 0.7rem;
  }
  .sound-list {
    max-height: 200px;
    overflow-y: auto;
  }
  .sound-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border-color, #2a2a3e);
  }
  .sound-item:hover {
    background: var(--hover-bg, #2a2a3e);
  }
  .sound-item.selected {
    background: var(--selected-bg, #3a3a5e);
  }
  .sound-id {
    font-weight: 600;
    color: var(--accent-color, #6366f1);
    min-width: 3rem;
  }
  .sound-name {
    flex: 1;
    color: var(--text-primary, #fff);
    font-size: 0.875rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sound-actions {
    display: flex;
    gap: 0.25rem;
  }
  .btn-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--btn-secondary-bg, #3a3a4e);
    border: none;
    border-radius: 4px;
    color: var(--text-primary, #fff);
    cursor: pointer;
    font-size: 0.75rem;
  }
  .btn-icon:hover {
    background: var(--btn-secondary-hover, #4a4a5e);
  }
  .btn-primary,
  .btn-secondary,
  .btn-save {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
  }
  .btn-primary,
  .btn-save {
    background: var(--accent-color, #6366f1);
    color: white;
  }
  .btn-primary:hover,
  .btn-save:hover {
    background: var(--accent-hover, #5558e3);
  }
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-secondary {
    background: var(--btn-secondary-bg, #3a3a4e);
    color: var(--text-primary, #fff);
  }
  .btn-secondary:hover {
    background: var(--btn-secondary-hover, #4a4a5e);
  }
  .loading {
    padding: 2rem;
    text-align: center;
    color: var(--text-secondary, #888);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
</style>
