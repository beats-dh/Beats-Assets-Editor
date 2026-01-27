<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CompleteAppearanceItem, CompleteSpriteInfo, SpriteAnimation } from '../../../types';
  import { translate } from '../../../i18n';
  import { invoke } from '../../../utils/invoke';
  import { showStatus } from '../../../utils'; 

  export let details: CompleteAppearanceItem;
  export let state: any;

  const dispatch = createEventDispatcher();

  // Local editable state
  let spriteInfo: CompleteSpriteInfo;
  
  // Watch for external changes to details/state
  $: if (details && details.frame_groups && details.frame_groups[state.frameGroupIndex]) {
    // Only update if we aren't currently editing (dirty check could be added, but for now strict sync)
    // Actually, we want to reflect selection changes immediately.
    spriteInfo = JSON.parse(JSON.stringify(details.frame_groups[state.frameGroupIndex].sprite_info));
  }

  // Helper to ensure animation object exists
  function ensureAnimation() {
    if (!spriteInfo.animation) {
      spriteInfo.animation = {
        loop_count: 0,
        loop_type: 0,
        default_start_phase: 0,
        synchronized: false,
        random_start_phase: false,
        phases: []
      };
    }
  }

  function getFrameCount(): number {
    if (!spriteInfo) return 1;
    if (spriteInfo.animation && spriteInfo.animation.phases.length > 0) {
      return spriteInfo.animation.phases.length;
    }
    return spriteInfo.pattern_frames ?? 1;
  }

  $: frameCount = getFrameCount();

  // Update phases array when frame count changes
  function updatePhases() {
    ensureAnimation();
    const currentPhases = spriteInfo.animation!.phases;
    const targetCount = spriteInfo.pattern_frames ?? 1; // Use pattern_frames as the source of truth for count
    
    if (currentPhases.length < targetCount) {
      // Add missing phases
      for (let i = currentPhases.length; i < targetCount; i++) {
        currentPhases.push({ duration_min: 100, duration_max: 100 });
      }
    } else if (currentPhases.length > targetCount) {
      // Remove excess
      currentPhases.length = targetCount;
    }
    spriteInfo.animation!.phases = currentPhases;
  }

  async function save() {
    try {
      const payload: Record<string, unknown> = {
        frame_group_index: state.frameGroupIndex,
        pattern_width: spriteInfo.pattern_width,
        pattern_height: spriteInfo.pattern_height,
        pattern_depth: spriteInfo.pattern_depth,
        layers: spriteInfo.layers,
        pattern_frames: spriteInfo.pattern_frames,
        bounding_square: spriteInfo.bounding_square,
        is_opaque: spriteInfo.is_opaque,
        is_animation: spriteInfo.is_animation,
        bounding_boxes: spriteInfo.bounding_boxes || spriteInfo.bounding_box_per_direction || []
      };

      if (spriteInfo.animation) {
        payload.animation = {
          default_start_phase: spriteInfo.animation.default_start_phase,
          loop_type: spriteInfo.animation.loop_type,
          loop_count: spriteInfo.animation.loop_count,
          synchronized: spriteInfo.animation.synchronized,
          random_start_phase: spriteInfo.animation.random_start_phase,
          phases: spriteInfo.animation.phases.map(p => ({
            duration_min: p.duration_min,
            duration_max: p.duration_max
          }))
        };
      } else {
        payload.animation = null;
      }

      await invoke('update_appearance_texture_settings', {
        category: details.appearance_type === 2 ? 'Outfits' : 'Objects', // Simplified category resolution
        id: details.id,
        update: payload
      });

      // Also trigger save_appearances_file as per legacy
      await invoke('save_appearances_file');

      dispatch('refresh'); // Tell parent to reload data
      showStatus(translate('status.textureSaved') || 'Saved successfully', 'success');
    } catch (err) {
      console.error('Failed to save texture settings', err);
      showStatus('Failed to save: ' + err, 'error');
    }
  }

  // Helper to add/remove bounding box
  function addBoundingBox() {
    // Legacy used 'bounding_boxes' in payload but 'bounding_box_per_direction' in some contexts?
    // Legacy `collectBoundingBoxes` reads from DOM.
    // The type `CompleteSpriteInfo` usually has `bounding_boxes`.
    // Let's use `bounding_boxes` property as per legacy payload construction.
    if (!spriteInfo.bounding_boxes) spriteInfo.bounding_boxes = [];
    spriteInfo.bounding_boxes.push({ x: 0, y: 0, width: 32, height: 32 });
    spriteInfo = spriteInfo; // Trigger update
  }

  function removeBoundingBox(index: number) {
    if (spriteInfo.bounding_boxes) {
      spriteInfo.bounding_boxes.splice(index, 1);
      spriteInfo = spriteInfo;
    }
  }
</script>

<div class="texture-settings-container">
  <div class="texture-form-section">
    <h4>{translate('texture.section.spriteSettings') || 'Sprite Settings'}</h4>
    {#if spriteInfo}
    <div class="texture-form-grid">
      <label>
        <span>{translate('texture.form.patternWidth') || 'Width'}</span>
        <input type="number" bind:value={spriteInfo.pattern_width} min="1" />
      </label>
      <label>
        <span>{translate('texture.form.patternHeight') || 'Height'}</span>
        <input type="number" bind:value={spriteInfo.pattern_height} min="1" />
      </label>
      <label>
        <span>{translate('texture.form.patternDepth') || 'Depth'}</span>
        <input type="number" bind:value={spriteInfo.pattern_depth} min="1" />
      </label>
      <label>
        <span>{translate('texture.form.layers') || 'Layers'}</span>
        <input type="number" bind:value={spriteInfo.layers} min="1" />
      </label>
      <label>
        <span>{translate('texture.form.patternFrames') || 'Frames'}</span>
        <input type="number" bind:value={spriteInfo.pattern_frames} min="1" on:change={updatePhases} />
      </label>
      <label>
        <span>{translate('texture.form.boundingSquare') || 'Bounding Square'}</span>
        <input type="number" bind:value={spriteInfo.bounding_square} min="0" />
      </label>
      
      <label class="texture-checkbox">
        <input type="checkbox" bind:checked={spriteInfo.is_opaque} />
        <span>{translate('texture.form.isOpaque') || 'Is Opaque'}</span>
      </label>
      <label class="texture-checkbox">
        <input type="checkbox" bind:checked={spriteInfo.is_animation} />
        <span>{translate('texture.form.isAnimation') || 'Is Animation'}</span>
      </label>
    </div>
    
    <div class="texture-form-actions">
      <button class="btn-primary" on:click={save}>{translate('texture.button.save') || 'Save'}</button>
    </div>
    {:else}
      <div class="texture-empty-state">No sprite info available</div>
    {/if}
  </div>

  {#if spriteInfo}
  <div class="texture-form-section">
    <h4>{translate('texture.section.animation') || 'Animation'}</h4>
    <div class="texture-form-grid texture-animation-grid">
      <label>
        <span>{translate('texture.form.frameCount') || 'Frame Count'}</span>
        <!-- Read-only view of frames, or editable? Legacy allows editing frame count in main form which affects phases -->
        <input type="number" value={spriteInfo.pattern_frames} disabled />
      </label>

      {#if spriteInfo.is_animation || (spriteInfo.pattern_frames && spriteInfo.pattern_frames > 1)}
        {#if !spriteInfo.animation}
           <!-- Auto-create if missing but flagged as animation -->
           {ensureAnimation() || ''}
        {/if}
        
        <label>
          <span>{translate('texture.form.defaultStartPhase') || 'Start Phase'}</span>
          <input type="number" bind:value={spriteInfo.animation.default_start_phase} min="0" />
        </label>
        <label>
            <span>{translate('texture.form.loopType') || 'Loop Type'}</span>
            <select bind:value={spriteInfo.animation.loop_type}>
                <option value={0}>PingPong</option>
                <option value={1}>Infinite</option>
                <option value={-1}>OneShot</option>
            </select>
        </label>
        <label>
          <span>{translate('texture.form.loopCount') || 'Loop Count'}</span>
          <input type="number" bind:value={spriteInfo.animation.loop_count} min="0" />
        </label>

        <label class="texture-checkbox">
            <input type="checkbox" bind:checked={spriteInfo.animation.synchronized} />
            <span>{translate('texture.form.synchronized') || 'Synchronized'}</span>
        </label>
        <label class="texture-checkbox">
            <input type="checkbox" bind:checked={spriteInfo.animation.random_start_phase} />
            <span>{translate('texture.form.randomStart') || 'Random Start'}</span>
        </label>
      {/if}
    </div>

    {#if spriteInfo.animation && spriteInfo.animation.phases}
      <div class="texture-animation-phases">
         {#each spriteInfo.animation.phases as phase, i}
           <div class="texture-phase-row">
             <label>
               <span class="texture-phase-label">Phase {i + 1} Min</span>
               <input type="number" bind:value={phase.duration_min} min="0" />
             </label>
             <label>
               <span class="texture-phase-label">Max</span>
               <input type="number" bind:value={phase.duration_max} min="0" />
             </label>
           </div>
         {/each}
      </div>
    {/if}
  </div>

  <div class="texture-form-section texture-bounding-section">
      <h4>{translate('texture.section.boundingBoxes') || 'Bounding Boxes'}</h4>
      <div class="texture-bounding-boxes">
          <table class="texture-bounding-table">
              <thead>
                  <tr>
                      <th>Idx</th>
                      <th>X</th>
                      <th>Y</th>
                      <th>W</th>
                      <th>H</th>
                      <th>Action</th>
                  </tr>
              </thead>
              <tbody>
                  {#if spriteInfo.bounding_boxes}
                      {#each spriteInfo.bounding_boxes as box, i}
                          <tr>
                              <td>{i + 1}</td>
                              <td><input type="number" bind:value={box.x} class="texture-box-x"></td>
                              <td><input type="number" bind:value={box.y} class="texture-box-y"></td>
                              <td><input type="number" bind:value={box.width} class="texture-box-width"></td>
                              <td><input type="number" bind:value={box.height} class="texture-box-height"></td>
                              <td><button class="texture-remove-box" on:click={() => removeBoundingBox(i)}>✕</button></td>
                          </tr>
                      {/each}
                  {/if}
              </tbody>
          </table>
          <button class="btn-secondary" on:click={addBoundingBox}>{translate('texture.bounding.button.add') || 'Add BBox'}</button>
      </div>
  </div>
  {/if}
</div>

<style>
  .texture-settings-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 2rem;
  }
  
  .texture-form-section {
    background: var(--surface-2);
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
  }

  h4 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .texture-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.5rem;
  }

  label {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
  }

  label span {
    margin-bottom: 0.25rem;
    color: var(--text-secondary);
  }

  input[type="number"], select {
    padding: 0.25rem;
    background: var(--surface-1);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    border-radius: 2px;
  }

  .texture-checkbox {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding-top: 1.2rem; /* Align with inputs */
  }

  .texture-checkbox input {
    margin: 0;
  }

  .texture-phase-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    background: var(--surface-1);
    border-radius: 2px;
  }

  .texture-bounding-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }

  .texture-bounding-table th {
    text-align: left;
    padding: 0.25rem;
    color: var(--text-secondary);
  }

  .texture-bounding-table td {
    padding: 0.25rem;
  }

  .texture-bounding-table input {
    width: 100%;
    max-width: 60px;
  }

  .texture-remove-box {
    background: transparent;
    border: none;
    color: var(--error-color, #ef4444);
    cursor: pointer;
    font-weight: bold;
  }

  .texture-form-actions {
    margin-top: 1rem;
    display: flex;
    justify-content: flex-end;
  }

  .btn-primary {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .btn-secondary {
    background: var(--surface-3);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 0.5rem;
  }
</style>
