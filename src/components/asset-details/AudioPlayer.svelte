<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invoke } from '../../utils/invoke';

  export let soundId: number;
  export let autoPlay = false;

  let audioSrc: string | null = null;
  let error = false;
  let audioEl: HTMLAudioElement;

  $: if (soundId) loadAudio(soundId);

  async function loadAudio(id: number) {
    error = false;
    audioSrc = null;
    try {
      const audioData = await invoke<string>('get_sound_audio_data', { soundId: id });
      if (audioData) {
        audioSrc = `data:audio/ogg;base64,${audioData}`;
      } else {
        error = true;
      }
    } catch (e) {
      console.error('Failed to load audio', e);
      error = true;
    }
  }

  function handleCanPlay() {
    if (autoPlay && audioEl) {
      audioEl.play().catch(() => {});
    }
  }
</script>

<div class="sound-audio-container">
  {#if error}
    <div class="audio-error">
      <span>❌ Failed to load audio</span>
    </div>
  {:else if audioSrc}
    <audio 
      controls 
      preload="metadata" 
      class="sound-player" 
      src={audioSrc} 
      bind:this={audioEl}
      on:canplay={handleCanPlay}
    >
      Your browser does not support the audio element.
    </audio>
  {:else}
    <div class="loading-audio">Loading audio...</div>
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

  .loading-audio, .audio-error {
    color: #888;
    font-size: 0.9rem;
    padding: 0.5rem;
    text-align: center;
  }

  .audio-error {
    color: var(--error-color, #ff4444);
  }
</style>