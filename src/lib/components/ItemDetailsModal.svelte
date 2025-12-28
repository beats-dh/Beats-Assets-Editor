<script lang="ts">
  import { invoke } from "../api/invoke";
  import { COMMANDS } from "../api/commands";

  // Props
  interface Props {
    category: string;
    itemId: number;
    spriteUrl?: string;
    onclose: () => void;
  }
  let { category, itemId, spriteUrl, onclose }: Props = $props();

  // Types
  interface FrameGroupInfo {
    id?: number;
    sprite_count: number;
    pattern_width?: number;
    pattern_height?: number;
    layers?: number;
  }

  interface AppearanceFlagsInfo {
    usable: boolean;
    container: boolean;
    take: boolean;
    hang: boolean;
    rotate: boolean;
    has_light: boolean;
    has_market_info: boolean;
    has_npc_data: boolean;
  }

  interface AppearanceDetails {
    id: number;
    name?: string;
    description?: string;
    appearance_type?: number;
    category: string;
    frame_groups: FrameGroupInfo[];
    flags?: AppearanceFlagsInfo;
  }

  // State
  let details = $state<AppearanceDetails | null>(null);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  // Load details on mount
  $effect(() => {
    loadDetails();
  });

  async function loadDetails() {
    isLoading = true;
    error = null;

    try {
      const result = await invoke<AppearanceDetails>(
        COMMANDS.GET_APPEARANCE_DETAILS,
        {
          category: category,
          id: itemId,
        }
      );
      details = result;
    } catch (e) {
      console.error("Error loading details:", e);
      error = e instanceof Error ? e.message : String(e);
    } finally {
      isLoading = false;
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onclose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      onclose();
    }
  }

  // Get flag badges
  function getFlagBadges(flags: AppearanceFlagsInfo): string[] {
    const badges: string[] = [];
    if (flags.usable) badges.push("Usable");
    if (flags.container) badges.push("Container");
    if (flags.take) badges.push("Pickupable");
    if (flags.hang) badges.push("Hangable");
    if (flags.rotate) badges.push("Rotatable");
    if (flags.has_light) badges.push("Has Light");
    if (flags.has_market_info) badges.push("Marketable");
    if (flags.has_npc_data) badges.push("NPC Trade");
    return badges;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Modal Backdrop -->
<div 
  class="modal-backdrop" 
  onclick={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <div class="modal-content">
    <!-- Header -->
    <div class="modal-header">
      <h2 class="modal-title">
        {#if details?.name}
          {details.name}
        {:else}
          Item #{itemId}
        {/if}
      </h2>
      <button class="close-btn" onclick={onclose} title="Fechar">✕</button>
    </div>

    <!-- Body -->
    <div class="modal-body">
      {#if isLoading}
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>Carregando detalhes...</p>
        </div>
      {:else if error}
        <div class="error">
          <p>Erro: {error}</p>
          <button onclick={loadDetails}>Tentar novamente</button>
        </div>
      {:else if details}
        <div class="details-grid">
          <!-- Preview -->
          <div class="preview-section">
            {#if spriteUrl}
              <img src={spriteUrl} alt="Item preview" class="preview-image" />
            {:else}
              <div class="no-preview">Sem preview</div>
            {/if}
          </div>

          <!-- Info -->
          <div class="info-section">
            <!-- Basic Info -->
            <div class="info-group">
              <h3>Informações Básicas</h3>
              <div class="info-row">
                <span class="label">ID:</span>
                <span class="value">{details.id}</span>
              </div>
              <div class="info-row">
                <span class="label">Categoria:</span>
                <span class="value">{details.category}</span>
              </div>
              {#if details.description}
                <div class="info-row">
                  <span class="label">Descrição:</span>
                  <span class="value">{details.description}</span>
                </div>
              {/if}
              {#if details.appearance_type !== undefined}
                <div class="info-row">
                  <span class="label">Tipo:</span>
                  <span class="value">{details.appearance_type}</span>
                </div>
              {/if}
            </div>

            <!-- Flags -->
            {#if details.flags}
              <div class="info-group">
                <h3>Propriedades</h3>
                <div class="flags-container">
                  {#each getFlagBadges(details.flags) as badge}
                    <span class="flag-badge">{badge}</span>
                  {/each}
                  {#if getFlagBadges(details.flags).length === 0}
                    <span class="no-flags">Nenhuma propriedade especial</span>
                  {/if}
                </div>
              </div>
            {/if}

            <!-- Frame Groups -->
            {#if details.frame_groups.length > 0}
              <div class="info-group">
                <h3>Sprites ({details.frame_groups.length} grupo{details.frame_groups.length > 1 ? 's' : ''})</h3>
                <div class="frame-groups">
                  {#each details.frame_groups as fg, i}
                    <div class="frame-group">
                      <span class="fg-label">Grupo {i + 1}:</span>
                      <span class="fg-value">{fg.sprite_count} sprites</span>
                      {#if fg.pattern_width && fg.pattern_height}
                        <span class="fg-detail">({fg.pattern_width}x{fg.pattern_height})</span>
                      {/if}
                      {#if fg.layers && fg.layers > 1}
                        <span class="fg-detail">{fg.layers} layers</span>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: var(--surface-bg, #1e293b);
    border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.2));
    border-radius: 12px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-soft, rgba(148, 163, 184, 0.2));
    background: rgba(15, 23, 42, 0.8);
  }

  .modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #e2e8f0);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary, #94a3b8);
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    max-height: calc(80vh - 60px);
  }

  .loading, .error {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary, #94a3b8);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(148, 163, 184, 0.2);
    border-top-color: #4f46e5;
    border-radius: 50%;
    margin: 0 auto 1rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .details-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1.5rem;
  }

  .preview-section {
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .preview-image {
    width: 64px;
    height: 64px;
    object-fit: contain;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.2));
    image-rendering: pixelated;
  }

  .no-preview {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    color: var(--text-disabled, #64748b);
    font-size: 0.75rem;
    text-align: center;
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .info-group h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary, #e2e8f0);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-row {
    display: flex;
    gap: 0.5rem;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .label {
    color: var(--text-secondary, #94a3b8);
    min-width: 80px;
  }

  .value {
    color: var(--text-primary, #e2e8f0);
    font-weight: 500;
  }

  .flags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .flag-badge {
    background: rgba(79, 70, 229, 0.2);
    color: #a5b4fc;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .no-flags {
    color: var(--text-disabled, #64748b);
    font-style: italic;
    font-size: 0.85rem;
  }

  .frame-groups {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .frame-group {
    display: flex;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .fg-label {
    color: var(--text-secondary, #94a3b8);
  }

  .fg-value {
    color: var(--text-primary, #e2e8f0);
    font-weight: 500;
  }

  .fg-detail {
    color: var(--text-disabled, #64748b);
    font-size: 0.8rem;
  }

  @media (max-width: 500px) {
    .details-grid {
      grid-template-columns: 1fr;
    }

    .preview-section {
      justify-content: flex-start;
    }
  }
</style>
