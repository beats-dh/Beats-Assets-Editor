import { invoke } from '@tauri-apps/api/core';
import type { CompleteAppearanceItem, CompleteFlags } from './types';
import { getVocationName, getVocationOptionsHTML, getFlagBool } from './utils';
import { getAppearanceSprites } from './spriteCache';
import { stopDetailAnimationPlayers, initAnimationPlayersForDetails, initDetailSpriteCardAnimations } from './animation';

// Current appearance being displayed
let currentAppearanceDetails: CompleteAppearanceItem | null = null;

// DOM references
let assetDetails: HTMLElement | null = null;
let detailsContent: HTMLElement | null = null;

export function initAssetDetailsElements(): void {
  assetDetails = document.querySelector('#asset-details');
  detailsContent = document.querySelector('#details-content');
}

export function getCurrentAppearanceDetails(): CompleteAppearanceItem | null {
  return currentAppearanceDetails;
}

export function setCurrentAppearanceDetails(details: CompleteAppearanceItem | null): void {
  currentAppearanceDetails = details;
}

export async function showAssetDetails(category: string, id: number): Promise<void> {
  console.log(`showAssetDetails called with category: ${category}, id: ${id}`);

  if (!assetDetails || !detailsContent) {
    console.error('assetDetails or detailsContent is null');
    return;
  }

  try {
    console.log('Invoking get_complete_appearance...');
    const completeData = await invoke('get_complete_appearance', {
      category,
      id
    }) as CompleteAppearanceItem;

    console.log('Received complete data:', completeData);
    currentAppearanceDetails = completeData;
    await displayCompleteAssetDetails(completeData, category);

    // Force display the modal
    assetDetails.style.display = 'flex';
    assetDetails.classList.add('show');
    console.log('Modal display:', window.getComputedStyle(assetDetails).display);
    console.log('Modal should now be visible');

    // Initialize animation players per frame group
    await initAnimationPlayersForDetails(completeData, category);

    // Load sprites for this specific item
    await loadDetailSprites(category, id);
  } catch (error) {
    console.error('Error loading asset details:', error);
  }
}

export async function loadDetailSprites(category: string, id: number): Promise<void> {
  try {
    const sprites = await getAppearanceSprites(category, id);
    const container = document.getElementById(`detail-sprites-${id}`);

    if (container) {
      if (sprites.length > 0) {
        container.innerHTML = `
          <div class="detail-sprites-grid">
            ${sprites.map((sprite, index) => `
              <div class="detail-sprite-item" data-agg-index="${index}">
                <img src="data:image/png;base64,${sprite}" class="detail-sprite-image" alt="Sprite ${index + 1}">
                <span class="sprite-index">#${index + 1}</span>
              </div>
            `).join('')}
          </div>
        `;
        // Initialize click-to-animate on sprite cards
        initDetailSpriteCardAnimations(id, sprites, currentAppearanceDetails);
      } else {
        container.innerHTML = `
          <div class="no-sprites">
            <div class="sprite-placeholder"></div>
            <span>No sprites available</span>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error(`Failed to load detail sprites for ${category} ${id}:`, error);
    const container = document.getElementById(`detail-sprites-${id}`);
    if (container) {
      container.innerHTML = `
        <div class="sprite-error">
          <span>❌ Failed to load sprites</span>
        </div>
      `;
    }
  }
}

export async function displayCompleteAssetDetails(details: CompleteAppearanceItem, category: string): Promise<void> {
  if (!detailsContent) return;

  const flags = details.flags;

  // Build basic boolean flags list
  const basicFlags = flags ? [
    { name: 'Clip', value: flags.clip },
    { name: 'Bottom', value: flags.bottom },
    { name: 'Top', value: flags.top },
    { name: 'Container', value: flags.container },
    { name: 'Cumulative', value: flags.cumulative },
    { name: 'Usable', value: flags.usable },
    { name: 'Force Use', value: flags.forceuse },
    { name: 'Multi Use', value: flags.multiuse },
    { name: 'Liquid Pool', value: flags.liquidpool },
    { name: 'Unpassable', value: flags.unpass },
    { name: 'Unmovable', value: flags.unmove },
    { name: 'Blocks Sight', value: flags.unsight },
    { name: 'Avoid Walk', value: flags.avoid },
    { name: 'No Move Animation', value: flags.no_movement_animation },
    { name: 'Takeable', value: flags.take },
    { name: 'Liquid Container', value: flags.liquidcontainer },
    { name: 'Hangable', value: flags.hang },
    { name: 'Rotatable', value: flags.rotate },
    { name: "Don't Hide", value: flags.dont_hide },
    { name: 'Translucent', value: flags.translucent },
    { name: 'Lying Object', value: flags.lying_object },
    { name: 'Animate Always', value: flags.animate_always },
    { name: 'Full Bank', value: flags.fullbank },
    { name: 'Ignore Look', value: flags.ignore_look },
    { name: 'Wrap', value: flags.wrap },
    { name: 'Unwrap', value: flags.unwrap },
    { name: 'Top Effect', value: flags.topeffect },
    { name: 'Corpse', value: flags.corpse },
    { name: 'Player Corpse', value: flags.player_corpse },
    { name: 'Ammo', value: flags.ammo },
    { name: 'Show Off Socket', value: flags.show_off_socket },
    { name: 'Reportable', value: flags.reportable },
    { name: 'Reverse Addons East', value: flags.reverse_addons_east },
    { name: 'Reverse Addons West', value: flags.reverse_addons_west },
    { name: 'Reverse Addons South', value: flags.reverse_addons_south },
    { name: 'Reverse Addons North', value: flags.reverse_addons_north },
    { name: 'Wearout', value: flags.wearout },
    { name: 'Clock Expire', value: flags.clockexpire },
    { name: 'Expire', value: flags.expire },
    { name: 'Expire Stop', value: flags.expirestop },
    { name: 'Deco Item Kit', value: flags.deco_item_kit },
    { name: 'Dual Wielding', value: flags.dual_wielding },
  ].filter(f => f.value === true) : [];

  const basicInfoHTML = generateBasicInfoHTML(details, category);
  const spritePreviewHTML = generateSpritePreviewHTML(details);
  const frameGroupsHTML = generateFrameGroupsHTML(details);
  const flagsHTML = generateFlagsHTML(basicFlags);
  const complexFlagsHTML = generateComplexFlagsHTML(flags);
  const editFormHTML = generateEditFormHTML(details, category, flags);

  detailsContent.innerHTML = `
    ${basicInfoHTML}
    ${spritePreviewHTML}
    ${frameGroupsHTML}
    ${flagsHTML}
    ${complexFlagsHTML}
  `;

  // Add edit content to the edit tab
  const editContent = document.getElementById('edit-content');
  if (editContent) {
    editContent.innerHTML = editFormHTML;
  }
}

function generateBasicInfoHTML(details: CompleteAppearanceItem, category: string): string {
  return `
    <div class="detail-section">
      <h4>Basic Information</h4>
      <div class="detail-item">
        <span class="detail-label">ID:</span>
        <span class="detail-value">#${details.id}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Name:</span>
        <span class="detail-value" id="detail-name-value">${details.name || 'Unnamed'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Description:</span>
        <span class="detail-value">${details.description || 'No description'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Category:</span>
        <span class="detail-value">${category}</span>
      </div>
    </div>
  `;
}

function generateSpritePreviewHTML(details: CompleteAppearanceItem): string {
  return `
    <div class="detail-section">
      <h4>Sprite Preview</h4>
      <div class="detail-sprites" id="detail-sprites-${details.id}">
        <div class="sprite-loading">🔄 Loading sprites...</div>
      </div>
    </div>
  `;
}

function generateFrameGroupsHTML(details: CompleteAppearanceItem): string {
  if (details.frame_groups.length === 0) return '';

  return `
    <div class="detail-section">
      <h4>Frame Groups (${details.frame_groups.length})</h4>
      ${details.frame_groups.map((fg, index) => {
        const spriteInfo = fg.sprite_info;
        return `
          <div class="frame-group-detail">
            <strong>Group ${index + 1}</strong>
            ${fg.fixed_frame_group !== undefined ? `
              <div class="detail-item">
                <span class="detail-label">Fixed Frame Group:</span>
                <span class="detail-value">${fg.fixed_frame_group}</span>
              </div>
            ` : ''}
            ${fg.id !== undefined ? `
              <div class="detail-item">
                <span class="detail-label">ID:</span>
                <span class="detail-value">${fg.id}</span>
              </div>
            ` : ''}
            ${spriteInfo ? generateSpriteInfoHTML(spriteInfo) : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function generateSpriteInfoHTML(spriteInfo: any): string {
  return `
    ${spriteInfo.pattern_width ? `
      <div class="detail-item">
        <span class="detail-label">Pattern Size:</span>
        <span class="detail-value">${spriteInfo.pattern_width}x${spriteInfo.pattern_height}x${spriteInfo.pattern_depth || 1}</span>
      </div>
    ` : ''}
    ${spriteInfo.layers ? `
      <div class="detail-item">
        <span class="detail-label">Layers:</span>
        <span class="detail-value">${spriteInfo.layers}</span>
      </div>
    ` : ''}
    ${spriteInfo.sprite_ids && spriteInfo.sprite_ids.length > 0 ? `
      <div class="detail-item-full sprite-ids-section">
        <div class="detail-label">Sprite IDs (${spriteInfo.sprite_ids.length} total):</div>
        <div class="sprite-ids-value">
          ${spriteInfo.sprite_ids.slice(0, 15).join(', ')}${spriteInfo.sprite_ids.length > 15 ? ', ...' : ''}
        </div>
        ${spriteInfo.sprite_ids.length > 15 ? `
          <button class="sprite-ids-expand-btn" onclick="
            const full = this.nextElementSibling;
            const preview = this.previousElementSibling;
            if (full.style.display === 'none') {
              full.style.display = 'block';
              preview.style.display = 'none';
              this.textContent = 'Show Less ▲';
            } else {
              full.style.display = 'none';
              preview.style.display = 'block';
              this.textContent = 'Show All ${spriteInfo.sprite_ids.length} IDs ▼';
            }
          ">Show All ${spriteInfo.sprite_ids.length} IDs ▼</button>
          <div class="sprite-ids-full" style="display: none;">
            ${spriteInfo.sprite_ids.join(', ')}
          </div>
        ` : ''}
      </div>
    ` : ''}
    ${spriteInfo.animation ? generateAnimationHTML(spriteInfo.animation) : ''}
  `;
}

function generateAnimationHTML(animation: any): string {
  return `
    <div class="detail-item-full animation-section">
      <div class="detail-label">Animation Details:</div>
      <div class="detail-value">
        <div>Phases: ${animation.phases.length}</div>
        ${animation.synchronized !== undefined ? `<div>Synchronized: ${animation.synchronized ? 'Yes' : 'No'}</div>` : ''}
        ${animation.loop_type !== undefined ? `<div>Loop Type: ${getLoopTypeName(animation.loop_type)}</div>` : ''}
        ${animation.loop_count !== undefined ? `<div>Loop Count: ${animation.loop_count}</div>` : ''}
        <div class="animation-phases">
          ${animation.phases.map((ph: any, idx: number) => `
            <div class="phase-item">
              <span class="phase-index">Phase #${idx + 1}</span>
              <span class="phase-duration">${ph.duration_min ?? '—'}-${ph.duration_max ?? '—'} ms</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function getLoopTypeName(loopType: number): string {
  if (loopType === -1) return 'Pingpong';
  if (loopType === 0) return 'Infinito';
  if (loopType === 1) return 'Contado';
  return `Desconhecido (${loopType})`;
}

function generateFlagsHTML(basicFlags: Array<{ name: string; value: boolean }>): string {
  if (basicFlags.length === 0) return '';

  return `
    <div class="detail-section">
      <h4>Active Flags (${basicFlags.length})</h4>
      <div class="flags-grid">
        ${basicFlags.map(flag => `
          <span class="flag-badge">✅ ${flag.name}</span>
        `).join('')}
      </div>
    </div>
  `;
}

function generateComplexFlagsHTML(flags: CompleteFlags | undefined): string {
  if (!flags) return '';

  let html = '';

  // Market
  if (flags.market) {
    html += `
      <div class="detail-section">
        <h4>Market Information</h4>
        ${flags.market.category !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Category:</span>
            <span class="detail-value">${getMarketCategoryName(flags.market.category)}</span>
          </div>
        ` : ''}
        ${flags.market.minimum_level !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Minimum Level:</span>
            <span class="detail-value">${flags.market.minimum_level}</span>
          </div>
        ` : ''}
        ${flags.market.trade_as_object_id !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Trade As Object ID:</span>
            <span class="detail-value">${flags.market.trade_as_object_id}</span>
          </div>
        ` : ''}
        ${flags.market.show_as_object_id !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Show As Object ID:</span>
            <span class="detail-value">${flags.market.show_as_object_id}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Light, Shift, Height, etc. (simplified for brevity)
  if (flags.light) {
    html += `
      <div class="detail-section">
        <h4>Light Properties</h4>
        ${flags.light.brightness !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Brightness:</span>
            <span class="detail-value">${flags.light.brightness}</span>
          </div>
        ` : ''}
        ${flags.light.color !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Color:</span>
            <span class="detail-value">${flags.light.color}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  return html;
}

function getMarketCategoryName(category: number): string {
  const categories: Record<number, string> = {
    1: 'Armors', 2: 'Amulets', 3: 'Boots', 4: 'Containers',
    5: 'Decoration', 6: 'Food', 7: 'Helmets', 8: 'Legs',
    9: 'Others', 10: 'Potions', 11: 'Rings', 12: 'Runes',
    13: 'Shields', 14: 'Tools', 15: 'Valuables', 16: 'Ammunition',
    17: 'Axes', 18: 'Clubs', 19: 'Distance Weapons', 20: 'Swords',
    21: 'Wands Rods', 22: 'Premium Scrolls', 23: 'Tibia Coins',
    24: 'Creature Products', 25: 'Quiver', 26: 'Soul Cores', 27: 'Fist Weapons'
  };
  return categories[category] ? `${categories[category]} (${category})` : `Unknown (${category})`;
}

// Generate edit form HTML - Complete version with all fields
function generateEditFormHTML(details: CompleteAppearanceItem, category: string, flags: CompleteFlags | undefined): string {
  const flagDefs = [
    { key: 'clip', label: 'Clip', value: !!flags?.clip },
    { key: 'bottom', label: 'Bottom', value: !!flags?.bottom },
    { key: 'top', label: 'Top', value: !!flags?.top },
    { key: 'container', label: 'Container', value: !!flags?.container },
    { key: 'cumulative', label: 'Cumulative', value: !!flags?.cumulative },
    { key: 'usable', label: 'Usable', value: !!flags?.usable },
    { key: 'forceuse', label: 'Force Use', value: !!flags?.forceuse },
    { key: 'multiuse', label: 'Multi-use', value: !!flags?.multiuse },
    { key: 'liquidpool', label: 'Liquid Pool', value: getFlagBool(flags, 'liquidpool') },
    { key: 'liquidcontainer', label: 'Liquid Container', value: !!flags?.liquidcontainer },
    { key: 'unpass', label: 'Unpassable', value: !!flags?.unpass },
    { key: 'unmove', label: 'Unmovable', value: !!flags?.unmove },
    { key: 'unsight', label: 'Block Sight', value: !!flags?.unsight },
    { key: 'avoid', label: 'Avoid Walk', value: !!flags?.avoid },
    { key: 'nomovementanimation', label: 'No Movement Animation', value: !!flags?.no_movement_animation },
    { key: 'take', label: 'Takeable', value: !!flags?.take },
    { key: 'hang', label: 'Hangable', value: !!flags?.hang },
    { key: 'rotate', label: 'Rotatable', value: !!flags?.rotate },
    { key: 'donthide', label: "Don't Hide", value: !!flags?.dont_hide },
    { key: 'translucent', label: 'Translucent', value: !!flags?.translucent },
    { key: 'lyingobject', label: 'Lying Object', value: !!flags?.lying_object },
    { key: 'animatealways', label: 'Animate Always', value: !!flags?.animate_always },
    { key: 'fullbank', label: 'Full Bank', value: !!flags?.fullbank },
    { key: 'ignorelook', label: 'Ignore Look', value: !!flags?.ignore_look },
    { key: 'wrap', label: 'Wrap', value: !!flags?.wrap },
    { key: 'unwrap', label: 'Unwrap', value: !!flags?.unwrap },
    { key: 'topeffect', label: 'Top Effect', value: !!flags?.topeffect },
    { key: 'corpse', label: 'Corpse', value: !!flags?.corpse },
    { key: 'playercorpse', label: 'Player Corpse', value: !!flags?.player_corpse },
    { key: 'ammo', label: 'Ammo', value: !!flags?.ammo },
    { key: 'showoffsocket', label: 'Show Off Socket', value: !!flags?.show_off_socket },
    { key: 'reportable', label: 'Reportable', value: !!flags?.reportable },
    { key: 'reverseaddonseast', label: 'Reverse Addons East', value: !!flags?.reverse_addons_east },
    { key: 'reverseaddonswest', label: 'Reverse Addons West', value: !!flags?.reverse_addons_west },
    { key: 'reverseaddonssouth', label: 'Reverse Addons South', value: !!flags?.reverse_addons_south },
    { key: 'reverseaddonsnorth', label: 'Reverse Addons North', value: !!flags?.reverse_addons_north },
    { key: 'wearout', label: 'Wearout', value: !!flags?.wearout },
    { key: 'clockexpire', label: 'Clock Expire', value: !!flags?.clockexpire },
    { key: 'expire', label: 'Expire', value: !!flags?.expire },
    { key: 'expirestop', label: 'Expire Stop', value: !!flags?.expirestop },
    { key: 'decoitemkit', label: 'Deco Item Kit', value: !!flags?.deco_item_kit },
    { key: 'dualwielding', label: 'Dual Wielding', value: !!flags?.dual_wielding },
    { key: 'hooksouth', label: 'Hook South', value: getFlagBool(flags, 'hooksouth') },
    { key: 'hookeast', label: 'Hook East', value: getFlagBool(flags, 'hookeast') },
  ];

  const flagsHtml = flagDefs.map(f => `
    <label class="flag-toggle">
      <input type="checkbox" class="flag-checkbox" id="flag-${f.key}" data-flag="${f.key}" data-category="${category}" data-id="${details.id}" ${f.value ? 'checked' : ''} />
      <span>${f.label}</span>
    </label>
  `).join('');

  return `
    <div class="detail-section">
      <h4>Editar Item</h4>
      <div class="detail-item">
        <span class="detail-label">Nome:</span>
        <input type="text" id="asset-name-input" value="${details.name || ''}" placeholder="Digite o nome" />
      </div>
      <div class="detail-item">
        <span class="detail-label">Descrição:</span>
        <textarea id="asset-description-input" rows="3" placeholder="Digite a descrição">${details.description || ''}</textarea>
      </div>
      <div class="detail-actions">
        <button id="save-basic-info" class="btn-primary" data-category="${category}" data-id="${details.id}">Salvar</button>
      </div>
    </div>

    <div class="detail-section">
      <h4>Flags Booleanas</h4>
      <div class="flags-grid">
        ${flagsHtml}
      </div>
    </div>

    <div class="detail-section">
      <h4>Light</h4>
      <div class="detail-item">
        <span class="detail-label">Brightness:</span>
        <div class="number-input">
          <input type="number" id="light-brightness" min="0" value="${flags?.light?.brightness ?? ''}" placeholder="ex: 255" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="light-brightness"></button>
            <button type="button" class="spinner-down" data-input-id="light-brightness"></button>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Color:</span>
        <div class="number-input">
          <input type="number" id="light-color" min="0" value="${flags?.light?.color ?? ''}" placeholder="ex: 215" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="light-color"></button>
            <button type="button" class="spinner-down" data-input-id="light-color"></button>
          </div>
        </div>
      </div>
      <button id="save-light" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Light</button>
    </div>

    <div class="detail-section">
      <h4>Shift</h4>
      <div class="detail-item">
        <span class="detail-label">X:</span>
        <div class="number-input">
          <input type="number" id="shift-x" value="${flags?.shift?.x ?? ''}" placeholder="ex: 1" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="shift-x"></button>
            <button type="button" class="spinner-down" data-input-id="shift-x"></button>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Y:</span>
        <div class="number-input">
          <input type="number" id="shift-y" value="${flags?.shift?.y ?? ''}" placeholder="ex: 2" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="shift-y"></button>
            <button type="button" class="spinner-down" data-input-id="shift-y"></button>
          </div>
        </div>
      </div>
      <button id="save-shift" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Shift</button>
    </div>

    <div class="detail-section">
      <h4>Height</h4>
      <div class="detail-item">
        <span class="detail-label">Elevation:</span>
        <div class="number-input">
          <input type="number" id="height-elevation" value="${flags?.height?.elevation ?? ''}" placeholder="ex: 8" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="height-elevation"></button>
            <button type="button" class="spinner-down" data-input-id="height-elevation"></button>
          </div>
        </div>
      </div>
      <button id="save-height" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Height</button>
    </div>

    <div class="detail-section">
      <h4>Write</h4>
      <div class="detail-item">
        <span class="detail-label">Max Text Length:</span>
        <div class="number-input">
          <input type="number" id="write-max-text-length" value="${flags?.write?.max_text_length ?? ''}" placeholder="ex: 120" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="write-max-text-length"></button>
            <button type="button" class="spinner-down" data-input-id="write-max-text-length"></button>
          </div>
        </div>
      </div>
      <button id="save-write" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Write</button>
    </div>

    <div class="detail-section">
      <h4>Write Once</h4>
      <div class="detail-item">
        <span class="detail-label">Max Text Length Once:</span>
        <div class="number-input">
          <input type="number" id="write-once-max-text-length" value="${flags?.write_once?.max_text_length_once ?? ''}" placeholder="ex: 60" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="write-once-max-text-length"></button>
            <button type="button" class="spinner-down" data-input-id="write-once-max-text-length"></button>
          </div>
        </div>
      </div>
      <button id="save-write-once" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Write Once</button>
    </div>

    <div class="detail-section">
      <h4>Automap</h4>
      <div class="detail-item">
        <span class="detail-label">Color:</span>
        <div class="number-input">
          <input type="number" id="automap-color" value="${flags?.automap?.color ?? ''}" placeholder="ex: 215" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="automap-color"></button>
            <button type="button" class="spinner-down" data-input-id="automap-color"></button>
          </div>
        </div>
      </div>
      <button id="save-automap" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Automap</button>
    </div>

    <div class="detail-section">
      <h4>Hook</h4>
      <div class="detail-item">
        <span class="detail-label">Direction:</span>
        <div class="select-input">
          <select id="hook-direction">
            ${(() => {
              const selected = flags?.hook?.direction ?? null;
              const options = [
                { value: 1, label: 'Sul' },
                { value: 2, label: 'Leste' }
              ];
              const empty = `<option value="" ${selected == null ? 'selected' : ''}>—</option>`;
              const optHtml = options.map(o => `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label} (${o.value})</option>`).join('');
              return empty + optHtml;
            })()}
          </select>
        </div>
      </div>
      <button id="save-hook" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Hook</button>
    </div>

    <div class="detail-section">
      <h4>Lens Help</h4>
      <div class="detail-item">
        <span class="detail-label">ID:</span>
        <div class="number-input">
          <input type="number" id="lenshelp-id" value="${flags?.lenshelp?.id ?? ''}" placeholder="ex: 1000" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="lenshelp-id"></button>
            <button type="button" class="spinner-down" data-input-id="lenshelp-id"></button>
          </div>
        </div>
      </div>
      <button id="save-lenshelp" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Lens Help</button>
    </div>

    <div class="detail-section">
      <h4>Clothes</h4>
      <div class="detail-item">
        <span class="detail-label">Slot:</span>
        <div class="number-input">
          <input type="number" id="clothes-slot" value="${flags?.clothes?.slot ?? ''}" placeholder="ex: 8" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="clothes-slot"></button>
            <button type="button" class="spinner-down" data-input-id="clothes-slot"></button>
          </div>
        </div>
      </div>
      <button id="save-clothes" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Clothes</button>
    </div>

    <div class="detail-section">
      <h4>Default Action</h4>
      <div class="detail-item">
        <span class="detail-label">Action:</span>
        <div class="select-input">
          <select id="default-action">
            ${(() => {
              const selected = flags?.default_action?.action ?? null;
              const options = [
                { value: 0, label: 'None' },
                { value: 1, label: 'Look' },
                { value: 2, label: 'Use' },
                { value: 3, label: 'Open' },
                { value: 4, label: 'Autowalk Highlight' },
              ];
              const empty = `<option value="" ${selected == null ? 'selected' : ''}>—</option>`;
              const optHtml = options.map(o => `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label} (${o.value})</option>`).join('');
              return empty + optHtml;
            })()}
          </select>
        </div>
      </div>
      <button id="save-default-action" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Default Action</button>
    </div>

    <div class="detail-section">
      <h4>Market</h4>
      <div class="detail-item">
        <span class="detail-label">Category:</span>
        <div class="select-input">
          <select id="market-category">
            ${(() => {
              const selected = flags?.market?.category ?? null;
              const options = [
                { value: 1, label: 'Armors' }, { value: 2, label: 'Amulets' },
                { value: 3, label: 'Boots' }, { value: 4, label: 'Containers' },
                { value: 5, label: 'Decoration' }, { value: 6, label: 'Food' },
                { value: 7, label: 'Helmets Hats' }, { value: 8, label: 'Legs' },
                { value: 9, label: 'Others' }, { value: 10, label: 'Potions' },
                { value: 11, label: 'Rings' }, { value: 12, label: 'Runes' },
                { value: 13, label: 'Shields' }, { value: 14, label: 'Tools' },
                { value: 15, label: 'Valuables' }, { value: 16, label: 'Ammunition' },
                { value: 17, label: 'Axes' }, { value: 18, label: 'Clubs' },
                { value: 19, label: 'Distance Weapons' }, { value: 20, label: 'Swords' },
                { value: 21, label: 'Wands Rods' }, { value: 22, label: 'Premium Scrolls' },
                { value: 23, label: 'Tibia Coins' }, { value: 24, label: 'Creature Products' },
                { value: 25, label: 'Quiver' }, { value: 26, label: 'Soul Cores' },
                { value: 27, label: 'Fist Weapons' },
              ];
              const empty = `<option value="" ${selected == null ? 'selected' : ''}>—</option>`;
              const optHtml = options.map(o => `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label} (${o.value})</option>`).join('');
              return empty + optHtml;
            })()}
          </select>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Trade As Object ID:</span>
        <div class="number-input">
          <input type="number" id="market-trade-as-object-id" value="${flags?.market?.trade_as_object_id ?? ''}" placeholder="ex: 1234" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="market-trade-as-object-id"></button>
            <button type="button" class="spinner-down" data-input-id="market-trade-as-object-id"></button>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Show As Object ID:</span>
        <div class="number-input">
          <input type="number" id="market-show-as-object-id" value="${flags?.market?.show_as_object_id ?? ''}" placeholder="ex: 5678" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="market-show-as-object-id"></button>
            <button type="button" class="spinner-down" data-input-id="market-show-as-object-id"></button>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Restrict To Vocation:</span>
        <select id="market-restrict-to-vocation">
          ${getVocationOptionsHTML((flags?.market?.restrict_to_vocation?.length ? flags.market.restrict_to_vocation[0] : null), true, true)}
        </select>
      </div>
      <div class="detail-item">
        <span class="detail-label">Minimum Level:</span>
        <div class="number-input">
          <input type="number" id="market-minimum-level" value="${flags?.market?.minimum_level ?? ''}" placeholder="ex: 20" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="market-minimum-level"></button>
            <button type="button" class="spinner-down" data-input-id="market-minimum-level"></button>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Name:</span>
        <input type="text" id="market-name" value="${details?.name ?? ''}" placeholder="ex: Magic Sword" />
      </div>
      <div class="detail-item">
        <span class="detail-label">Vocation:</span>
        <select id="market-vocation">
          ${getVocationOptionsHTML(flags?.market?.vocation ?? null, true, true)}
        </select>
      </div>
      <button id="save-market" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Market</button>
    </div>

    <div class="detail-section">
      <h4>Bank</h4>
      <div class="detail-item">
        <span class="detail-label">Waypoints:</span>
        <div class="number-input">
          <input type="number" id="bank-waypoints" value="${flags?.bank?.waypoints ?? ''}" placeholder="ex: 3" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="bank-waypoints"></button>
            <button type="button" class="spinner-down" data-input-id="bank-waypoints"></button>
          </div>
        </div>
      </div>
      <button id="save-bank" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Bank</button>
    </div>

    <div class="detail-section">
      <h4>Changed To Expire</h4>
      <div class="detail-item">
        <span class="detail-label">Former Object Type ID:</span>
        <div class="number-input">
          <input type="number" id="changed-to-expire-former-id" value="${flags?.changed_to_expire?.former_object_typeid ?? ''}" placeholder="ex: 100" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="changed-to-expire-former-id"></button>
            <button type="button" class="spinner-down" data-input-id="changed-to-expire-former-id"></button>
          </div>
        </div>
      </div>
      <button id="save-changed-to-expire" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Changed To Expire</button>
    </div>

    <div class="detail-section">
      <h4>Cyclopedia Item</h4>
      <div class="detail-item">
        <span class="detail-label">Type:</span>
        <div class="number-input">
          <input type="number" id="cyclopedia-type" value="${flags?.cyclopedia_item?.cyclopedia_type ?? ''}" placeholder="ex: 1" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="cyclopedia-type"></button>
            <button type="button" class="spinner-down" data-input-id="cyclopedia-type"></button>
          </div>
        </div>
      </div>
      <button id="save-cyclopedia-item" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Cyclopedia Item</button>
    </div>

    <div class="detail-section">
      <h4>Upgrade Classification</h4>
      <div class="detail-item">
        <span class="detail-label">Classification:</span>
        <div class="number-input">
          <input type="number" id="upgrade-classification" value="${flags?.upgrade_classification?.upgrade_classification ?? ''}" placeholder="ex: 2" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="upgrade-classification"></button>
            <button type="button" class="spinner-down" data-input-id="upgrade-classification"></button>
          </div>
        </div>
      </div>
      <button id="save-upgrade-classification" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Upgrade Classification</button>
    </div>

    <div class="detail-section">
      <h4>Skill Wheel Gem</h4>
      <div class="detail-item">
        <span class="detail-label">Gem Quality ID:</span>
        <div class="number-input">
          <input type="number" id="skillwheel-gem-quality-id" value="${flags?.skillwheel_gem?.gem_quality_id ?? ''}" placeholder="ex: 1" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="skillwheel-gem-quality-id"></button>
            <button type="button" class="spinner-down" data-input-id="skillwheel-gem-quality-id"></button>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Vocation:</span>
        <select id="skillwheel-vocation-id">
          ${getVocationOptionsHTML(flags?.skillwheel_gem?.vocation_id ?? null, true, false)}
        </select>
      </div>
      <button id="save-skillwheel-gem" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Skill Wheel Gem</button>
    </div>

    <div class="detail-section">
      <h4>Imbueable</h4>
      <div class="detail-item">
        <span class="detail-label">Slot Count:</span>
        <div class="number-input">
          <input type="number" id="imbueable-slot-count" value="${flags?.imbueable?.slot_count ?? ''}" placeholder="ex: 1" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="imbueable-slot-count"></button>
            <button type="button" class="spinner-down" data-input-id="imbueable-slot-count"></button>
          </div>
        </div>
      </div>
      <button id="save-imbueable" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Imbueable</button>
    </div>

    <div class="detail-section">
      <h4>Proficiency</h4>
      <div class="detail-item">
        <span class="detail-label">Proficiency ID:</span>
        <div class="number-input">
          <input type="number" id="proficiency-id" value="${flags?.proficiency?.proficiency_id ?? ''}" placeholder="ex: 3" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="proficiency-id"></button>
            <button type="button" class="spinner-down" data-input-id="proficiency-id"></button>
          </div>
        </div>
      </div>
      <button id="save-proficiency" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Proficiency</button>
    </div>

    <div class="detail-section">
      <h4>Weapon Type</h4>
      <div class="detail-item">
        <span class="detail-label">Type:</span>
        <div class="select-input">
          <select id="weapon-type">
            ${(() => {
              const selected = typeof flags?.weapon_type === 'number' ? flags.weapon_type : null;
              const options = [
                { value: 0, label: 'No Weapon' },
                { value: 1, label: 'Sword' },
                { value: 2, label: 'Axe' },
                { value: 3, label: 'Club' },
                { value: 4, label: 'Fist' },
                { value: 5, label: 'Bow' },
                { value: 6, label: 'Crossbow' },
                { value: 7, label: 'Wand Rod' },
                { value: 8, label: 'Throw' },
              ];
              const empty = `<option value="" ${selected == null ? 'selected' : ''}>—</option>`;
              const optHtml = options.map(o => `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label} (${o.value})</option>`).join('');
              return empty + optHtml;
            })()}
          </select>
        </div>
      </div>
      <button id="save-weapon-type" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Weapon Type</button>
    </div>

    <div class="detail-section">
      <h4>Transparency Level</h4>
      <div class="detail-item">
        <span class="detail-label">Level:</span>
        <div class="number-input">
          <input type="number" id="transparency-level" value="${flags?.transparency_level ?? ''}" placeholder="ex: 50" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="transparency-level"></button>
            <button type="button" class="spinner-down" data-input-id="transparency-level"></button>
          </div>
        </div>
      </div>
      <button id="save-transparency-level" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Transparency Level</button>
    </div>
  `;
}

export function closeAssetDetails(): void {
  if (assetDetails) {
    stopDetailAnimationPlayers();
    assetDetails.classList.remove('show');
    assetDetails.style.display = 'none';
  }
}

export async function refreshAssetDetails(category: string, id: number): Promise<void> {
  try {
    stopDetailAnimationPlayers();
    const updated = await invoke('get_complete_appearance', { category, id }) as CompleteAppearanceItem;
    currentAppearanceDetails = updated;
    await displayCompleteAssetDetails(updated, category);
    await initAnimationPlayersForDetails(updated, category);
    await loadDetailSprites(category, id);
  } catch (err) {
    console.error('Falha ao atualizar detalhes do item:', err);
  }
}
