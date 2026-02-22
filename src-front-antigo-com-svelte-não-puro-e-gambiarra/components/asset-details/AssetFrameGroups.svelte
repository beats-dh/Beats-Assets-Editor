<script lang="ts">
  import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../types';

  export let details: CompleteAppearanceItem;

  function getFixedFrameGroupName(group: number | undefined): string {
    if (group === undefined || group === null) return 'Unknown';
    switch (group) {
      case 0: return 'Outfit Idle';
      case 1: return 'Outfit Moving';
      case 2: return 'Object Initial';
      default: return `Unknown (${group})`;
    }
  }

  function getAnimationModeName(mode: number | undefined): string {
    if (mode === undefined || mode === null) return 'Unknown';
    switch (mode) {
      case 0: return 'Asynchronized';
      case 1: return 'Synchronized';
      default: return `Unknown (${mode})`;
    }
  }

  function getLoopTypeName(loopType: number): string {
    if (loopType === -1) return 'Pingpong';
    if (loopType === 0) return 'Infinito';
    if (loopType === 1) return 'Contado';
    return `Desconhecido (${loopType})`;
  }
</script>

{#if details && details.frame_groups && details.frame_groups.length > 0}
  <div class="detail-section">
    <h4>Frame Groups ({details.frame_groups.length})</h4>
    {#each details.frame_groups as fg, index}
      <div class="frame-group-detail">
        <strong>Group {index + 1}</strong>
        {#if fg.fixed_frame_group !== undefined}
          <div class="detail-item">
            <span class="detail-label">Fixed Frame Group:</span>
            <span class="detail-value">{getFixedFrameGroupName(fg.fixed_frame_group)} ({fg.fixed_frame_group})</span>
          </div>
        {/if}
        {#if fg.id !== undefined}
          <div class="detail-item">
            <span class="detail-label">Group ID:</span>
            <span class="detail-value">{fg.id}</span>
          </div>
        {/if}
        
        {#if fg.sprite_info}
          {@const spriteInfo = fg.sprite_info}
          {#if spriteInfo.pattern_width !== undefined}
            <div class="detail-item">
              <span class="detail-label">Pattern Width:</span>
              <span class="detail-value">{spriteInfo.pattern_width}</span>
            </div>
          {/if}
          {#if spriteInfo.pattern_height !== undefined}
            <div class="detail-item">
              <span class="detail-label">Pattern Height:</span>
              <span class="detail-value">{spriteInfo.pattern_height}</span>
            </div>
          {/if}
          {#if spriteInfo.pattern_depth !== undefined}
            <div class="detail-item">
              <span class="detail-label">Pattern Depth:</span>
              <span class="detail-value">{spriteInfo.pattern_depth}</span>
            </div>
          {/if}
          {#if spriteInfo.layers !== undefined}
            <div class="detail-item">
              <span class="detail-label">Layers:</span>
              <span class="detail-value">{spriteInfo.layers}</span>
            </div>
          {/if}
          {#if spriteInfo.pattern_size !== undefined}
            <div class="detail-item">
              <span class="detail-label">Pattern Size:</span>
              <span class="detail-value">{spriteInfo.pattern_size}</span>
            </div>
          {/if}
          {#if spriteInfo.pattern_layers !== undefined}
            <div class="detail-item">
              <span class="detail-label">Pattern Layers:</span>
              <span class="detail-value">{spriteInfo.pattern_layers}</span>
            </div>
          {/if}
          {#if spriteInfo.pattern_x !== undefined}
            <div class="detail-item">
              <span class="detail-label">Pattern X:</span>
              <span class="detail-value">{spriteInfo.pattern_x}</span>
            </div>
          {/if}
          {#if spriteInfo.pattern_y !== undefined}
            <div class="detail-item">
              <span class="detail-label">Pattern Y:</span>
              <span class="detail-value">{spriteInfo.pattern_y}</span>
            </div>
          {/if}
          {#if spriteInfo.pattern_z !== undefined}
            <div class="detail-item">
              <span class="detail-label">Pattern Z:</span>
              <span class="detail-value">{spriteInfo.pattern_z}</span>
            </div>
          {/if}
          {#if spriteInfo.pattern_frames !== undefined}
            <div class="detail-item">
              <span class="detail-label">Pattern Frames:</span>
              <span class="detail-value">{spriteInfo.pattern_frames}</span>
            </div>
          {/if}
          {#if spriteInfo.bounding_square !== undefined}
            <div class="detail-item">
              <span class="detail-label">Bounding Square:</span>
              <span class="detail-value">{spriteInfo.bounding_square}</span>
            </div>
          {/if}
          {#if spriteInfo.is_opaque !== undefined}
            <div class="detail-item">
              <span class="detail-label">Is Opaque:</span>
              <span class="detail-value">{spriteInfo.is_opaque ? '✅ Yes' : '❌ No'}</span>
            </div>
          {/if}
          {#if spriteInfo.is_animation !== undefined}
            <div class="detail-item">
              <span class="detail-label">Is Animation:</span>
              <span class="detail-value">{spriteInfo.is_animation ? '✅ Yes' : '❌ No'}</span>
            </div>
          {/if}

          <!-- Sprite IDs -->
          {#if spriteInfo.sprite_ids && spriteInfo.sprite_ids.length > 0}
            <div class="detail-item-full sprite-ids-section">
              <div class="detail-label">Sprite IDs ({spriteInfo.sprite_ids.length} total):</div>
              <div class="sprite-ids-value">
                {spriteInfo.sprite_ids.slice(0, 15).join(', ')}{spriteInfo.sprite_ids.length > 15 ? ', ...' : ''}
              </div>
              {#if spriteInfo.sprite_ids.length > 15}
                <details>
                  <summary>Show All {spriteInfo.sprite_ids.length} IDs</summary>
                  <div class="sprite-ids-full">
                    {spriteInfo.sprite_ids.join(', ')}
                  </div>
                </details>
              {/if}
            </div>
          {/if}

          <!-- Bounding Boxes -->
          {#if spriteInfo.bounding_boxes && spriteInfo.bounding_boxes.length > 0}
            <div class="detail-item-full bounding-boxes-section">
              <div class="detail-label">Bounding Boxes per Direction:</div>
              <div class="bounding-boxes-table">
                <div class="bb-header">
                  <span>Direction</span>
                  <span>X</span>
                  <span>Y</span>
                  <span>Width</span>
                  <span>Height</span>
                </div>
                {#each spriteInfo.bounding_boxes as box, idx}
                  <div class="bb-row">
                    <span class="bb-direction">#{idx + 1}</span>
                    <span>{box.x ?? '—'}</span>
                    <span>{box.y ?? '—'}</span>
                    <span>{box.width ?? '—'}</span>
                    <span>{box.height ?? '—'}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Animation -->
          {#if spriteInfo.animation}
            {@const anim = spriteInfo.animation}
            <div class="detail-item-full animation-section">
              <div class="detail-label">Animation Details:</div>
              <div class="detail-value">
                <div>Phases: {anim.phases.length}</div>
                {#if anim.default_start_phase !== undefined}<div>Default Start Phase: {anim.default_start_phase}</div>{/if}
                {#if anim.random_start_phase !== undefined}<div>Random Start Phase: {anim.random_start_phase ? 'Yes' : 'No'}</div>{/if}
                {#if anim.synchronized !== undefined}<div>Synchronized: {anim.synchronized ? 'Yes' : 'No'}</div>{/if}
                {#if anim.loop_type !== undefined}<div>Loop Type: {getLoopTypeName(anim.loop_type)}</div>{/if}
                {#if anim.loop_count !== undefined}<div>Loop Count: {anim.loop_count}</div>{/if}
                {#if anim.animation_mode !== undefined}<div>Animation Mode: {getAnimationModeName(anim.animation_mode)}</div>{/if}
                
                <div class="animation-phases">
                  {#each anim.phases as ph, idx}
                    <div class="phase-item">
                      <span class="phase-index">Phase #{idx + 1}</span>
                      <span class="phase-duration">{ph.duration_min ?? '—'}-{ph.duration_max ?? '—'} ms</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
{/if}
