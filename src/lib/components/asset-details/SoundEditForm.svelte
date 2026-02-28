<script lang="ts">
  import { invoke } from "../../../utils/invoke";
  import { translate } from "../../../i18n";
  import { assetsState } from "../../../stores/assetsState.svelte";
  import { confirmState } from "../../../stores/confirmState.svelte";
  import { selectionState } from "../../../stores/selectionState.svelte";
  import { loadAssetsData } from "../../../services/assetService";
  interface Props {
    id: number;
    onSave?: () => void;
  }
  let { id, onSave }: Props = $props();
  let data = $state<any>(null);
  let loading = $state(false);
  let error = $state("");
  let subcategory = $derived(assetsState.currentSubcategory || "All");

  // Form fields
  let soundType = $state("Unknown");
  let soundIdValue = $state<number | undefined>();
  let randomSoundIds = $state<number[]>([]);
  let randomPitchMin = $state<number | undefined>();
  let randomPitchMax = $state<number | undefined>();
  let randomVolumeMin = $state<number | undefined>();
  let randomVolumeMax = $state<number | undefined>();
  let loopingSoundId = $state<number | undefined>();
  let delayedEffects = $state<
    Array<{ numeric_sound_effect_id: number; delay_seconds: number }>
  >([]);
  let maxSoundDistance = $state<number | undefined>();
  let countedAppearanceTypes = $state<number[]>([]);
  let soundEffectsByCount = $state<
    Array<{ count: number; looping_sound_id: number }>
  >([]);
  let musicType = $state("Unknown");

  const typeOptions = [
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
  const musicOptions = ["Unknown", "Music", "Music Immediate", "Music Title"];

  $effect(() => {
    if (id) loadData(id);
  });

  async function loadData(soundId: number) {
    loading = true;
    error = "";
    data = null;
    try {
      if (subcategory === "Ambience Streams") {
        data = await invoke("get_ambience_stream_by_id", { id: soundId });
        data._type = "Ambience Stream";
        loopingSoundId = data.looping_sound_id;
        delayedEffects = [...(data.delayed_effects || [])];
      } else if (subcategory === "Ambience Object Streams") {
        data = await invoke("get_ambience_object_stream_by_id", {
          id: soundId,
        });
        data._type = "Ambience Object Stream";
        maxSoundDistance = data.max_sound_distance;
        countedAppearanceTypes = [...(data.counted_appearance_types || [])];
        soundEffectsByCount = [...(data.sound_effects || [])];
      } else if (subcategory === "Music Templates") {
        data = await invoke("get_music_template_by_id", { id: soundId });
        data._type = "Music Template";
        soundIdValue = data.sound_id;
        musicType = data.music_type || "Unknown";
      } else {
        data = await invoke("get_numeric_sound_effect_by_id", { id: soundId });
        data._type = "Sound Effect";
        soundType = data.sound_type || "Unknown";
        soundIdValue = data.sound_id;
        randomSoundIds = [...(data.random_sound_ids || [])];
        randomPitchMin = data.random_pitch_min;
        randomPitchMax = data.random_pitch_max;
        randomVolumeMin = data.random_volume_min;
        randomVolumeMax = data.random_volume_max;
      }
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }

  async function handleSave() {
    try {
      if (data._type === "Sound Effect") {
        const info: any = {
          id,
          sound_type: soundType,
          sound_id: soundIdValue !== undefined ? soundIdValue : undefined,
          random_sound_ids: soundIdValue !== undefined ? [] : randomSoundIds,
          random_pitch_min: randomPitchMin,
          random_pitch_max: randomPitchMax,
          random_volume_min: randomVolumeMin,
          random_volume_max: randomVolumeMax,
        };
        if (id === 0) await invoke("add_numeric_sound_effect", { info });
        else await invoke("update_numeric_sound_effect", { info });
      } else if (data._type === "Ambience Stream") {
        await invoke("update_ambience_stream", {
          info: {
            id,
            looping_sound_id: loopingSoundId || 0,
            delayed_effects: delayedEffects.filter(
              (d) => d.numeric_sound_effect_id > 0,
            ),
          },
        });
      } else if (data._type === "Ambience Object Stream") {
        await invoke("update_ambience_object_stream", {
          info: {
            id,
            max_sound_distance: maxSoundDistance,
            counted_appearance_types: countedAppearanceTypes,
            sound_effects: soundEffectsByCount.filter(
              (e) => e.count > 0 && e.looping_sound_id > 0,
            ),
          },
        });
      } else if (data._type === "Music Template") {
        await invoke("update_music_template", {
          info: { id, sound_id: soundIdValue || 0, music_type: musicType },
        });
      }
      await invoke("save_sounds_file");
      alert(translate("asset.sound.edit.saved"));
      if (onSave) onSave();
    } catch (e) {
      console.error("Failed to save sound", e);
      alert(translate("asset.sound.edit.saveFail", { err: String(e) }));
    }
  }

  async function handleDelete() {
    if (data._type !== "Sound Effect") return;
    confirmState.show(
      translate("asset.sound.edit.confirmDelete"),
      translate("asset.sound.edit.confirmDeleteTitle"),
      async () => {
        try {
          await invoke("delete_numeric_sound_effect", { id });
          await invoke("save_sounds_file");
          selectionState.closeDetails();
          await loadAssetsData();
        } catch (e) {
          console.error("Failed to delete sound", e);
          alert(translate("asset.sound.edit.deleteFail", { err: String(e) }));
        }
      },
    );
  }

  function addDelayedEffect() {
    delayedEffects = [
      ...delayedEffects,
      { numeric_sound_effect_id: 0, delay_seconds: 0 },
    ];
  }
  function removeDelayedEffect(i: number) {
    delayedEffects = delayedEffects.filter((_, idx) => idx !== i);
  }
  function addSoundEffectByCount() {
    soundEffectsByCount = [
      ...soundEffectsByCount,
      { count: 0, looping_sound_id: 0 },
    ];
  }
  function removeSoundEffectByCount(i: number) {
    soundEffectsByCount = soundEffectsByCount.filter((_, idx) => idx !== i);
  }
</script>

{#if loading}
  <div class="loading-spinner">{translate("loading.subtitle")}</div>
{:else if data}
  <div class="edit-section">
    <h3>{translate("asset.sound.edit.title", { type: data._type })}</h3>
    {#if data._type === "Sound Effect"}
      <div class="form-grid">
        <label
          >{translate("asset.sound.type")}<select bind:value={soundType}
            >{#each typeOptions as t}<option value={t}
                >{t === "Unknown"
                  ? translate("general.unknown")
                  : translate(
                      `asset.sound.type.${t.charAt(0).toLowerCase() + t.slice(1).replace(/ /g, "")}` as any,
                    )}</option
              >{/each}</select
          ></label
        >
        <label
          >{translate("asset.sound.edit.soundIdSimple")}<input
            type="number"
            bind:value={soundIdValue}
            placeholder={translate("asset.sound.edit.optRandom")}
          /></label
        >
        <label
          >{translate("asset.sound.edit.randomIds")}<input
            type="text"
            value={randomSoundIds.join(",")}
            oninput={(e) =>
              (randomSoundIds = (e.target as HTMLInputElement).value
                .split(",")
                .map((s) => Number(s.trim()))
                .filter((n) => !isNaN(n) && n > 0))}
            placeholder={translate("asset.sound.edit.randomPl")}
          /></label
        >
        <label
          >{translate("asset.sound.edit.pitchMin")}<input
            type="number"
            step="0.01"
            bind:value={randomPitchMin}
          /></label
        >
        <label
          >{translate("asset.sound.edit.pitchMax")}<input
            type="number"
            step="0.01"
            bind:value={randomPitchMax}
          /></label
        >
        <label
          >{translate("asset.sound.edit.volMin")}<input
            type="number"
            step="0.01"
            bind:value={randomVolumeMin}
          /></label
        >
        <label
          >{translate("asset.sound.edit.volMax")}<input
            type="number"
            step="0.01"
            bind:value={randomVolumeMax}
          /></label
        >
      </div>
      <div class="edit-actions">
        <button class="btn-save" onclick={handleSave}
          >{translate("asset.sound.edit.save")}</button
        ><button class="btn-delete" onclick={handleDelete}
          >{translate("asset.sound.edit.deleteSound")}</button
        >
      </div>
    {:else if data._type === "Ambience Stream"}
      <div class="form-grid">
        <label
          >{translate("asset.sound.loopingId")}<input
            type="number"
            bind:value={loopingSoundId}
          /></label
        >
      </div>
      <div class="details-section">
        <h4>{translate("asset.sound.delayedEffectsTitle")}</h4>
        {#each delayedEffects as effect, i}<div class="table-row delay-row">
            <input
              type="number"
              bind:value={effect.numeric_sound_effect_id}
              placeholder={translate("asset.sound.effectId")}
            /><input
              type="number"
              bind:value={effect.delay_seconds}
              placeholder={translate("asset.sound.delaySecs")}
            /><button
              type="button"
              class="remove-delay"
              onclick={() => removeDelayedEffect(i)}
              >{translate("asset.sound.edit.remove")}</button
            >
          </div>{/each}<button type="button" onclick={addDelayedEffect}
          >{translate("asset.sound.edit.addEffect")}</button
        >
      </div>
      <div class="edit-actions">
        <button class="btn-save" onclick={handleSave}
          >{translate("asset.sound.edit.save")}</button
        >
      </div>
    {:else if data._type === "Ambience Object Stream"}
      <div class="form-grid">
        <label
          >{translate("asset.sound.maxDist")}<input
            type="number"
            bind:value={maxSoundDistance}
          /></label
        ><label
          >{translate("asset.sound.edit.countedTypesComma")}<input
            type="text"
            value={countedAppearanceTypes.join(",")}
            oninput={(e) =>
              (countedAppearanceTypes = (e.target as HTMLInputElement).value
                .split(",")
                .map((s) => Number(s.trim()))
                .filter((n) => !isNaN(n)))}
          /></label
        >
      </div>
      <div class="details-section">
        <h4>{translate("asset.sound.effectsByCount")}</h4>
        {#each soundEffectsByCount as effect, i}<div
            class="table-row effect-row"
          >
            <input
              type="number"
              bind:value={effect.count}
              placeholder={translate("asset.sound.count")}
            /><input
              type="number"
              bind:value={effect.looping_sound_id}
              placeholder={translate("asset.sound.loopingId")}
            /><button
              type="button"
              class="remove-effect"
              onclick={() => removeSoundEffectByCount(i)}
              >{translate("asset.sound.edit.remove")}</button
            >
          </div>{/each}<button type="button" onclick={addSoundEffectByCount}
          >{translate("asset.sound.edit.addEffect")}</button
        >
      </div>
      <div class="edit-actions">
        <button class="btn-save" onclick={handleSave}
          >{translate("asset.sound.edit.save")}</button
        >
      </div>
    {:else if data._type === "Music Template"}
      <div class="form-grid">
        <label
          >{translate("asset.sound.soundId")}<input
            type="number"
            bind:value={soundIdValue}
          /></label
        ><label
          >{translate("asset.sound.musicType")}<select bind:value={musicType}
            >{#each musicOptions as o}<option value={o}
                >{o === "Unknown"
                  ? translate("general.unknown")
                  : translate(
                      `asset.sound.music.${o.toLowerCase().replace("music ", "")}` as any,
                    )}</option
              >{/each}</select
          ></label
        >
      </div>
      <div class="edit-actions">
        <button class="btn-save" onclick={handleSave}
          >{translate("asset.sound.edit.save")}</button
        >
      </div>
    {/if}
  </div>
{/if}

<style>
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
  .edit-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  .btn-save {
    background: var(--primary-color);
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .btn-delete {
    background: var(--error-color, #ff4444);
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .table-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
</style>
