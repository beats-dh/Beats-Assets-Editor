<script lang="ts">
  import { invoke } from "../../../utils/invoke";
  import { translate } from "../../../i18n";
  interface Props {
    soundId: number;
    autoPlay?: boolean;
  }
  let { soundId, autoPlay = false }: Props = $props();
  let audioSrc = $state<string | null>(null);
  let error = $state(false);
  let audioEl = $state<HTMLAudioElement | undefined>();

  $effect(() => {
    if (soundId) loadAudio(soundId);
  });

  async function loadAudio(id: number) {
    error = false;
    audioSrc = null;
    try {
      const audioData = await invoke<string>("get_sound_audio_data", {
        soundId: id,
      });
      if (audioData) {
        audioSrc = `data:audio/ogg;base64,${audioData}`;
      } else {
        error = true;
      }
    } catch (e) {
      console.error("Failed to load audio", e);
      error = true;
    }
  }

  function handleCanPlay() {
    if (autoPlay && audioEl) audioEl.play().catch(() => {});
  }
</script>

<div class="sound-audio-container">
  {#if error}
    <div class="audio-error"><span>{translate("asset.audio.fail")}</span></div>
  {:else if audioSrc}
    <audio
      controls
      preload="metadata"
      class="sound-player"
      src={audioSrc}
      bind:this={audioEl}
      oncanplay={handleCanPlay}
    >
      {translate("asset.audio.noSupport")}
    </audio>
  {:else}
    <div class="loading-audio">{translate("asset.audio.loading")}</div>
  {/if}
</div>

<style>
  .sound-audio-container {
    margin-top: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 0.5rem;
    border-radius: 4px;
  }
  .sound-player {
    width: 100%;
    height: 32px;
  }
  .loading-audio,
  .audio-error {
    color: var(--text-muted);
    font-size: 0.9rem;
    padding: 0.5rem;
    text-align: center;
  }
  .audio-error {
    color: var(--error-color, #ff4444);
  }
</style>
