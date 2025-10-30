import { invoke } from '@tauri-apps/api/core';
import { getAppearanceSprites } from './spriteCache';
import { computeSpriteIndex, computeGroupOffsetsFromDetails } from './animation';
import { showStatus } from './utils';
import type { CompleteAppearanceItem, CompleteSpriteInfo, SpriteAnimation } from './types';

interface OutfitPreviewState {
  frameGroupIndex: number;
  direction: number;
  addon: number;
  mount: number;
  frame: number;
  blendLayers: boolean;
  showFullAddons: boolean;
  autoAnimate: boolean;
  showBoundingBoxes: boolean;
  headColor: string;
  bodyColor: string;
  legsColor: string;
  feetColor: string;
  backgroundColor: string;
}

interface ObjectPreviewState {
  frameGroupIndex: number;
  patternX: number;
  patternY: number;
  patternZ: number;
  layer: number;
  frame: number;
  showBoundingBoxes: boolean;
}

interface RGB { r: number; g: number; b: number; }

type ImageCache = Map<number, Promise<HTMLImageElement>>;

type TextureCategory = 'Outfits' | 'Objects' | 'Other';

interface NormalizedBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function renderTextureTab(details: CompleteAppearanceItem, category: string): Promise<void> {
  const textureContent = document.getElementById('texture-content');
  if (!textureContent) return;

  const normalizedCategory = (category === 'Outfits' || category === 'Objects') ? category as TextureCategory : 'Other';

  if (normalizedCategory === 'Other') {
    textureContent.innerHTML = `
      <div class="texture-empty-state">
        <p>Texture tools are only available for Objects and Outfits.</p>
      </div>
    `;
    return;
  }

  if (normalizedCategory === 'Outfits') {
    await renderOutfitTextureTab(textureContent, details, category);
  } else if (normalizedCategory === 'Objects') {
    await renderObjectTextureTab(textureContent, details, category);
  }
}

function hexToRgb(hex: string): RGB {
  const sanitized = hex.replace('#', '');
  const parsed = sanitized.length === 3
    ? sanitized.split('').map(ch => ch + ch).join('')
    : sanitized.padEnd(6, '0');
  const bigint = parseInt(parsed, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function getFrameCount(spriteInfo: CompleteSpriteInfo | undefined): number {
  if (!spriteInfo) return 1;
  if (spriteInfo.animation && spriteInfo.animation.phases.length > 0) {
    return spriteInfo.animation.phases.length;
  }
  if (spriteInfo.pattern_frames && spriteInfo.pattern_frames > 0) {
    return spriteInfo.pattern_frames;
  }
  return 1;
}

function createImageLoader(): (index: number, sprites: string[], cache: ImageCache) => Promise<HTMLImageElement> {
  return async (index: number, sprites: string[], cache: ImageCache): Promise<HTMLImageElement> => {
    if (cache.has(index)) {
      return cache.get(index)!;
    }
    const base64 = sprites[index];
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = `data:image/png;base64,${base64}`;
    });
    cache.set(index, promise);
    return promise;
  };
}

function ensureNumber(value: number | undefined | null, fallback = 0): number {
  return typeof value === 'number' && !isNaN(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function buildCommonFormHTML(): string {
  return `
    <div class="texture-form-section">
      <h4>Sprite Settings</h4>
      <div class="texture-form-grid">
        <label>Pattern Width<input type="number" id="texture-pattern-width" min="0" /></label>
        <label>Pattern Height<input type="number" id="texture-pattern-height" min="0" /></label>
        <label>Pattern Depth<input type="number" id="texture-pattern-depth" min="0" /></label>
        <label>Layers<input type="number" id="texture-pattern-layers" min="0" /></label>
        <label>Pattern Frames<input type="number" id="texture-pattern-frames" min="0" /></label>
        <label>Bounding Square<input type="number" id="texture-bounding-square" min="0" /></label>
        <label class="texture-checkbox"><input type="checkbox" id="texture-is-opaque" /> Is Opaque</label>
        <label class="texture-checkbox"><input type="checkbox" id="texture-is-animation" /> Mark as Animation</label>
      </div>
    </div>
    <div class="texture-form-section">
      <h4>Animation</h4>
      <div class="texture-form-grid texture-animation-grid">
        <label>Frame Count<input type="number" id="texture-animation-frame-count" min="0" /></label>
        <label>Default Start Phase<input type="number" id="texture-animation-default-phase" min="0" /></label>
        <label>Loop Type<input type="number" id="texture-animation-loop-type" /></label>
        <label>Loop Count<input type="number" id="texture-animation-loop-count" min="0" /></label>
        <label class="texture-checkbox"><input type="checkbox" id="texture-animation-synchronized" /> Synchronized</label>
        <label class="texture-checkbox"><input type="checkbox" id="texture-animation-random-start" /> Random Start Phase</label>
      </div>
      <div id="texture-animation-phases" class="texture-animation-phases"></div>
    </div>
    <div class="texture-form-section">
      <h4>Bounding Boxes</h4>
      <div class="texture-bounding-boxes">
        <table class="texture-bounding-table">
          <thead>
            <tr>
              <th>#</th>
              <th>X</th>
              <th>Y</th>
              <th>Width</th>
              <th>Height</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="texture-bounding-box-body"></tbody>
        </table>
        <button type="button" id="texture-add-bounding-box" class="btn-secondary">Add Bounding Box</button>
      </div>
    </div>
    <div class="texture-form-actions">
      <button type="button" id="texture-save-button" class="btn-primary">Save Texture</button>
    </div>
  `;
}

function setNumberInput(id: string, value: number | undefined | null): void {
  const input = document.getElementById(id) as HTMLInputElement | null;
  if (!input) return;
  if (value === undefined || value === null) {
    input.value = '';
  } else {
    input.value = String(value);
  }
}

function setCheckbox(id: string, value: boolean | undefined | null, fallback = false): void {
  const input = document.getElementById(id) as HTMLInputElement | null;
  if (!input) return;
  if (value === undefined || value === null) {
    input.checked = fallback;
  } else {
    input.checked = value;
  }
}

function populateCommonForm(spriteInfo: CompleteSpriteInfo | undefined): void {
  setNumberInput('texture-pattern-width', spriteInfo?.pattern_width ?? null);
  setNumberInput('texture-pattern-height', spriteInfo?.pattern_height ?? null);
  setNumberInput('texture-pattern-depth', spriteInfo?.pattern_depth ?? null);
  setNumberInput('texture-pattern-layers', spriteInfo?.layers ?? null);
  setNumberInput('texture-pattern-frames', spriteInfo?.pattern_frames ?? getFrameCount(spriteInfo));
  setNumberInput('texture-bounding-square', spriteInfo?.bounding_square ?? null);
  setCheckbox('texture-is-opaque', spriteInfo?.is_opaque ?? false);
  setCheckbox('texture-is-animation', spriteInfo?.is_animation ?? (getFrameCount(spriteInfo) > 1));
}

function populateAnimationForm(spriteInfo: CompleteSpriteInfo | undefined): void {
  const frameCount = getFrameCount(spriteInfo);
  setNumberInput('texture-animation-frame-count', frameCount);
  const animation = spriteInfo?.animation;
  setNumberInput('texture-animation-default-phase', animation?.default_start_phase ?? 0);
  setNumberInput('texture-animation-loop-type', animation?.loop_type ?? 0);
  setNumberInput('texture-animation-loop-count', animation?.loop_count ?? 0);
  setCheckbox('texture-animation-synchronized', animation?.synchronized ?? false);
  setCheckbox('texture-animation-random-start', animation?.random_start_phase ?? false);
  updateAnimationPhaseRows(frameCount, animation);
}

function updateAnimationPhaseRows(count: number, animation?: SpriteAnimation): void {
  const container = document.getElementById('texture-animation-phases') as HTMLElement | null;
  if (!container) return;
  container.innerHTML = '';
  if (count <= 0) {
    container.innerHTML = '<p class="texture-empty">No animation phases defined.</p>';
    return;
  }
  for (let i = 0; i < count; i++) {
    const phase = animation?.phases?.[i];
    const min = phase?.duration_min ?? '';
    const max = phase?.duration_max ?? '';
    const row = document.createElement('div');
    row.className = 'texture-phase-row';
    row.dataset.phaseIndex = String(i);
    row.innerHTML = `
      <label>Phase ${i + 1} Min<input type="number" class="texture-phase-min" min="0" value="${min === '' ? '' : min}"></label>
      <label>Max<input type="number" class="texture-phase-max" min="0" value="${max === '' ? '' : max}"></label>
    `;
    container.appendChild(row);
  }
}

function populateBoundingBoxes(spriteInfo: CompleteSpriteInfo | undefined): void {
  const body = document.getElementById('texture-bounding-box-body') as HTMLTableSectionElement | null;
  if (!body) return;
  body.innerHTML = '';
  const boxes = spriteInfo?.bounding_boxes ?? [];
  if (boxes.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.className = 'texture-empty-row';
    emptyRow.innerHTML = '<td colspan="6">No bounding boxes defined.</td>';
    body.appendChild(emptyRow);
    return;
  }
  boxes.forEach((box, index) => {
    const row = document.createElement('tr');
    row.dataset.index = String(index);
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><input type="number" class="texture-box-x" value="${box.x ?? ''}" min="0" /></td>
      <td><input type="number" class="texture-box-y" value="${box.y ?? ''}" min="0" /></td>
      <td><input type="number" class="texture-box-width" value="${box.width ?? ''}" min="0" /></td>
      <td><input type="number" class="texture-box-height" value="${box.height ?? ''}" min="0" /></td>
      <td><button type="button" class="texture-remove-box">✕</button></td>
    `;
    body.appendChild(row);
  });
}

function collectBoundingBoxes(): Array<{ x?: number | null; y?: number | null; width?: number | null; height?: number | null; }> {
  const body = document.getElementById('texture-bounding-box-body') as HTMLTableSectionElement | null;
  if (!body) return [];
  const rows = Array.from(body.querySelectorAll<HTMLTableRowElement>('tr'));
  const boxes: Array<{ x?: number | null; y?: number | null; width?: number | null; height?: number | null; }> = [];
  for (const row of rows) {
    if (row.classList.contains('texture-empty-row')) continue;
    const xInput = row.querySelector<HTMLInputElement>('.texture-box-x');
    const yInput = row.querySelector<HTMLInputElement>('.texture-box-y');
    const wInput = row.querySelector<HTMLInputElement>('.texture-box-width');
    const hInput = row.querySelector<HTMLInputElement>('.texture-box-height');
    const parse = (input: HTMLInputElement | null): number | null => {
      if (!input) return null;
      const value = input.value.trim();
      if (value === '') return null;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    };
    boxes.push({
      x: parse(xInput),
      y: parse(yInput),
      width: parse(wInput),
      height: parse(hInput),
    });
  }
  return boxes;
}

function parseBoxValue(value: number | null | undefined): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
}

function getPreviewBoundingBoxes(spriteInfo?: CompleteSpriteInfo): NormalizedBoundingBox[] {
  const body = document.getElementById('texture-bounding-box-body') as HTMLTableSectionElement | null;
  const liveBoxes = body ? collectBoundingBoxes() : [];
  const source = body ? liveBoxes : spriteInfo?.bounding_boxes ?? [];
  return source.map((box) => ({
    x: parseBoxValue(box.x),
    y: parseBoxValue(box.y),
    width: parseBoxValue(box.width),
    height: parseBoxValue(box.height),
  }));
}

function getBoundingSquareValue(): number | null {
  const input = document.getElementById('texture-bounding-square') as HTMLInputElement | null;
  if (!input) return null;
  const value = Number(input.value || '');
  return Number.isFinite(value) && value > 0 ? value : null;
}

function computePreviewDimensions(
  baseWidth: number,
  baseHeight: number,
  boxes: NormalizedBoundingBox[],
  boundingSquare: number | null
): { width: number; height: number } {
  let width = baseWidth;
  let height = baseHeight;
  for (const box of boxes) {
    width = Math.max(width, box.x + box.width);
    height = Math.max(height, box.y + box.height);
  }
  if (boundingSquare && boundingSquare > 0) {
    width = Math.max(width, boundingSquare);
    height = Math.max(height, boundingSquare);
  }
  return { width, height };
}

function drawBoundingSquareOverlay(ctx: CanvasRenderingContext2D, boundingSquare: number | null): void {
  if (!boundingSquare || boundingSquare <= 0) return;
  ctx.save();
  ctx.strokeStyle = '#4caf50';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(0, 0, boundingSquare, boundingSquare);
  ctx.restore();
}

function collectAnimationSettings(): { default_start_phase?: number | null; loop_type?: number | null; loop_count?: number | null; synchronized?: boolean; random_start_phase?: boolean; phases: Array<{ duration_min?: number | null; duration_max?: number | null; }> } | null {
  const frameInput = document.getElementById('texture-animation-frame-count') as HTMLInputElement | null;
  const frameCount = frameInput ? Number(frameInput.value || '0') : 0;
  if (!frameCount || frameCount <= 1) {
    return null;
  }
  const parseNumber = (id: string): number | null => {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) return null;
    const value = input.value.trim();
    if (value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };
  const parseCheckbox = (id: string): boolean => {
    const input = document.getElementById(id) as HTMLInputElement | null;
    return !!input?.checked;
  };

  const phasesContainer = document.getElementById('texture-animation-phases') as HTMLElement | null;
  const phases: Array<{ duration_min?: number | null; duration_max?: number | null; }> = [];
  if (phasesContainer) {
    const rows = Array.from(phasesContainer.querySelectorAll<HTMLElement>('.texture-phase-row'));
    rows.forEach((row) => {
      const minInput = row.querySelector<HTMLInputElement>('.texture-phase-min');
      const maxInput = row.querySelector<HTMLInputElement>('.texture-phase-max');
      const parseValue = (input: HTMLInputElement | null): number | null => {
        if (!input) return null;
        const value = input.value.trim();
        if (value === '') return null;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
      };
      phases.push({
        duration_min: parseValue(minInput),
        duration_max: parseValue(maxInput),
      });
    });
  }

  return {
    default_start_phase: parseNumber('texture-animation-default-phase'),
    loop_type: parseNumber('texture-animation-loop-type'),
    loop_count: parseNumber('texture-animation-loop-count'),
    synchronized: parseCheckbox('texture-animation-synchronized'),
    random_start_phase: parseCheckbox('texture-animation-random-start'),
    phases,
  };
}

function collectTextureUpdatePayload(frameGroupIndex: number): Record<string, unknown> {
  const parseNumber = (id: string): number | null => {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) return null;
    const value = input.value.trim();
    if (value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const parseBoolean = (id: string): boolean => {
    const input = document.getElementById(id) as HTMLInputElement | null;
    return !!input?.checked;
  };

  const animationSettings = collectAnimationSettings();
  const payload: Record<string, unknown> = {
    frame_group_index: frameGroupIndex,
    pattern_width: parseNumber('texture-pattern-width'),
    pattern_height: parseNumber('texture-pattern-height'),
    pattern_depth: parseNumber('texture-pattern-depth'),
    layers: parseNumber('texture-pattern-layers'),
    pattern_frames: parseNumber('texture-pattern-frames'),
    bounding_square: parseNumber('texture-bounding-square'),
    is_opaque: parseBoolean('texture-is-opaque'),
    is_animation: parseBoolean('texture-is-animation'),
    bounding_boxes: collectBoundingBoxes(),
  };

  if (animationSettings === null) {
    payload.animation = null;
  } else {
    payload.animation = {
      ...animationSettings,
    };
  }

  return payload;
}

async function saveTextureSettings(category: string, id: number, update: Record<string, unknown>, saveButton: HTMLButtonElement | null): Promise<void> {
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.dataset.originalText = saveButton.textContent || '';
    saveButton.textContent = 'Saving...';
  }
  try {
    await invoke('update_appearance_texture_settings', {
      category,
      id,
      update,
    });
    await invoke('save_appearances_file');
    showStatus('Texture settings saved successfully.', 'success');
    document.dispatchEvent(new CustomEvent('texture-settings-saved', {
      detail: { category, id },
    }));
  } catch (error) {
    console.error('Failed to save texture settings', error);
    showStatus('Failed to save texture settings.', 'error');
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      const original = saveButton.dataset.originalText || 'Save Texture';
      saveButton.textContent = original;
    }
  }
}

async function renderOutfitTextureTab(container: HTMLElement, details: CompleteAppearanceItem, category: string): Promise<void> {
  container.innerHTML = `
    <div class="texture-layout">
      <div class="texture-preview-column">
        <div class="texture-preview-card">
          <canvas id="outfit-preview-canvas" width="96" height="96"></canvas>
        </div>
        <div class="texture-preview-controls">
          <div class="texture-control-row">
            <label>Frame Group
              <select id="texture-frame-group-select">
                ${details.frame_groups.map((_, index) => `<option value="${index}">Group ${index + 1}</option>`).join('')}
              </select>
            </label>
          </div>
          <div class="texture-control-row" id="outfit-direction-controls"></div>
          <div class="texture-control-row">
            <label>Addon
              <input type="range" id="outfit-addon-slider" min="0" max="0" value="0" />
            </label>
            <span id="outfit-addon-label" class="texture-control-label">Addon 0</span>
          </div>
          <div class="texture-control-row">
            <label>Frame
              <input type="range" id="outfit-frame-slider" min="0" max="0" value="0" />
            </label>
            <span id="outfit-frame-label" class="texture-control-label">Frame 1</span>
          </div>
          <div class="texture-control-row texture-color-row">
            <label>Head<input type="color" id="outfit-color-head" value="#ffc107" /></label>
            <label>Body<input type="color" id="outfit-color-body" value="#ff5722" /></label>
            <label>Legs<input type="color" id="outfit-color-legs" value="#4caf50" /></label>
            <label>Feet<input type="color" id="outfit-color-feet" value="#2196f3" /></label>
          </div>
          <div class="texture-control-row">
            <label>Background<input type="color" id="outfit-background-color" value="#262626" /></label>
          </div>
          <div class="texture-control-row texture-checkbox-row">
            <label><input type="checkbox" id="outfit-blend-layers" checked /> Blend layers</label>
            <label><input type="checkbox" id="outfit-full-addons" checked /> Show full addons</label>
            <label><input type="checkbox" id="outfit-show-bboxes" checked /> Show bounding boxes</label>
            <label><input type="checkbox" id="outfit-auto-animate" /> Animate preview</label>
            <label id="outfit-mount-wrapper" style="display:none"><input type="checkbox" id="outfit-mount-toggle" /> Mount</label>
          </div>
        </div>
      </div>
      <div class="texture-settings-column">
        ${buildCommonFormHTML()}
      </div>
    </div>
  `;

  const canvas = document.getElementById('outfit-preview-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const sprites = await getAppearanceSprites(category, details.id);
  const imageCache: ImageCache = new Map();
  const loadImage = createImageLoader();
  const groupOffsets = computeGroupOffsetsFromDetails(details);

  const state: OutfitPreviewState = {
    frameGroupIndex: 0,
    direction: 0,
    addon: 0,
    mount: 0,
    frame: 0,
    blendLayers: true,
    showFullAddons: true,
    autoAnimate: false,
    showBoundingBoxes: true,
    headColor: '#ffc107',
    bodyColor: '#ff5722',
    legsColor: '#4caf50',
    feetColor: '#2196f3',
    backgroundColor: '#262626',
  };

  let animationTimer: number | null = null;

  const getCurrentSpriteInfo = (): CompleteSpriteInfo | undefined => details.frame_groups[state.frameGroupIndex]?.sprite_info;

  const updateDirectionButtons = (): void => {
    const container = document.getElementById('outfit-direction-controls');
    if (!container) return;
    const spriteInfo = getCurrentSpriteInfo();
    const directionCount = Math.max(1, ensureNumber(spriteInfo?.pattern_width, 1));
    const labels = ['N', 'E', 'S', 'W'];
    container.innerHTML = Array.from({ length: directionCount }).map((_, index) => {
      const label = labels[index] || String(index + 1);
      const active = state.direction === index ? 'active' : '';
      return `<button type="button" class="texture-direction-btn ${active}" data-direction="${index}">${label}</button>`;
    }).join('');
  };

  const stopAnimation = (): void => {
    if (animationTimer !== null) {
      window.clearInterval(animationTimer);
      animationTimer = null;
    }
  };

  const drawBoundingBoxes = (boxes: NormalizedBoundingBox[]): void => {
    if (!boxes.length) return;
    const directionIndex = clamp(state.direction, 0, boxes.length - 1);
    const box = boxes[directionIndex] || boxes[0];
    if (!box) return;
    ctx.save();
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 1;
    const x = ensureNumber(box.x, 0);
    const y = ensureNumber(box.y, 0);
    const w = ensureNumber(box.width, 0);
    const h = ensureNumber(box.height, 0);
    if (w > 0 && h > 0) {
      ctx.strokeRect(x, y, w, h);
    }
    ctx.restore();
  };

  const renderSpriteVariant = async (
    spriteInfo: CompleteSpriteInfo,
    baseOffset: number,
    direction: number,
    addon: number,
    mount: number,
    frame: number
  ): Promise<HTMLCanvasElement> => {
    const layers = Math.max(1, ensureNumber(spriteInfo.layers, 1));
    const frameCount = getFrameCount(spriteInfo);
    const localFrame = frameCount > 0 ? frame % frameCount : 0;
    const baseIndex = baseOffset + computeSpriteIndex(spriteInfo, 0, direction, addon, mount, localFrame);
    const baseImage = await loadImage(baseIndex, sprites, imageCache);
    const offscreen = document.createElement('canvas');
    offscreen.width = baseImage.width;
    offscreen.height = baseImage.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return offscreen;
    offCtx.drawImage(baseImage, 0, 0);

    if (state.blendLayers && layers > 1) {
      const layerIndex = baseOffset + computeSpriteIndex(spriteInfo, 1, direction, addon, mount, localFrame);
      const templateImage = await loadImage(layerIndex, sprites, imageCache);
      const templateCanvas = document.createElement('canvas');
      templateCanvas.width = templateImage.width;
      templateCanvas.height = templateImage.height;
      const templateCtx = templateCanvas.getContext('2d');
      if (templateCtx) {
        templateCtx.drawImage(templateImage, 0, 0);
        const templateData = templateCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);
        const baseData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
        const head = hexToRgb(state.headColor);
        const body = hexToRgb(state.bodyColor);
        const legs = hexToRgb(state.legsColor);
        const feet = hexToRgb(state.feetColor);
        for (let i = 0; i < templateData.data.length; i += 4) {
          const rt = templateData.data[i];
          const gt = templateData.data[i + 1];
          const bt = templateData.data[i + 2];
          const alpha = templateData.data[i + 3];
          if (alpha === 0) continue;
          let color: RGB | null = null;
          if (rt > 0 && gt > 0 && bt === 0) {
            color = head;
          } else if (rt > 0 && gt === 0 && bt === 0) {
            color = body;
          } else if (rt === 0 && gt > 0 && bt === 0) {
            color = legs;
          } else if (rt === 0 && gt === 0 && bt > 0) {
            color = feet;
          }
          if (!color) continue;
          baseData.data[i] = Math.round((baseData.data[i] + color.r) / 2);
          baseData.data[i + 1] = Math.round((baseData.data[i + 1] + color.g) / 2);
          baseData.data[i + 2] = Math.round((baseData.data[i + 2] + color.b) / 2);
        }
        offCtx.putImageData(baseData, 0, 0);
      }
    }

    return offscreen;
  };

  const draw = async (): Promise<void> => {
    const spriteInfo = getCurrentSpriteInfo();
    if (!spriteInfo) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const frameCount = getFrameCount(spriteInfo);
    const boxes = getPreviewBoundingBoxes(spriteInfo);
    const boundingSquare = getBoundingSquareValue();
    const baseOffset = groupOffsets[state.frameGroupIndex] ?? 0;
    const directionMax = Math.max(0, ensureNumber(spriteInfo.pattern_width, 1) - 1);
    const addonMax = Math.max(0, ensureNumber(spriteInfo.pattern_height, 1) - 1);
    const mountMax = Math.max(0, ensureNumber(spriteInfo.pattern_depth, 1) - 1);
    state.direction = clamp(state.direction, 0, directionMax);
    state.addon = clamp(state.addon, 0, addonMax);
    state.mount = clamp(state.mount, 0, mountMax);
    state.frame = clamp(state.frame, 0, Math.max(frameCount - 1, 0));

    const direction = state.direction;
    const mount = state.mount;
    const background = hexToRgb(state.backgroundColor);

    const variants: number[] = [];
    if (state.showFullAddons) {
      for (let addon = 0; addon <= addonMax; addon++) {
        variants.push(addon);
      }
    } else {
      variants.push(state.addon);
    }

    let initialized = false;
    ctx.fillStyle = `rgb(${background.r}, ${background.g}, ${background.b})`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const addon of variants) {
      const rendered = await renderSpriteVariant(spriteInfo, baseOffset, direction, addon, mount, state.frame);
      if (!initialized) {
        const { width, height } = computePreviewDimensions(rendered.width, rendered.height, boxes, boundingSquare);
        canvas.width = width;
        canvas.height = height;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        initialized = true;
      }
      ctx.drawImage(rendered, 0, 0);
    }

    if (state.showBoundingBoxes) {
      drawBoundingSquareOverlay(ctx, boundingSquare);
      drawBoundingBoxes(boxes);
    }
  };

  const refreshPreviewControls = (): void => {
    const spriteInfo = getCurrentSpriteInfo();
    const addonSlider = document.getElementById('outfit-addon-slider') as HTMLInputElement | null;
    const addonLabel = document.getElementById('outfit-addon-label');
    const frameSlider = document.getElementById('outfit-frame-slider') as HTMLInputElement | null;
    const frameLabel = document.getElementById('outfit-frame-label');
    const mountWrapper = document.getElementById('outfit-mount-wrapper');
    const mountToggle = document.getElementById('outfit-mount-toggle') as HTMLInputElement | null;

    if (spriteInfo && addonSlider) {
      const addonMax = Math.max(0, ensureNumber(spriteInfo.pattern_height, 1) - 1);
      addonSlider.max = String(addonMax);
      addonSlider.value = String(clamp(state.addon, 0, addonMax));
      addonSlider.disabled = state.showFullAddons || addonMax === 0;
      if (addonLabel) addonLabel.textContent = `Addon ${addonSlider.value}`;
    }

    if (spriteInfo && frameSlider) {
      const frameCount = getFrameCount(spriteInfo);
      frameSlider.max = String(Math.max(0, frameCount - 1));
      frameSlider.value = String(clamp(state.frame, 0, Math.max(0, frameCount - 1)));
      frameSlider.disabled = frameCount <= 1;
      if (frameLabel) frameLabel.textContent = `Frame ${Number(frameSlider.value) + 1}`;
    }

    if (spriteInfo && mountWrapper && mountToggle) {
      const mountMax = Math.max(0, ensureNumber(spriteInfo.pattern_depth, 1) - 1);
      if (mountMax > 0) {
        mountWrapper.style.display = '';
        mountToggle.checked = state.mount > 0;
      } else {
        mountWrapper.style.display = 'none';
        mountToggle.checked = false;
        state.mount = 0;
      }
    }

    updateDirectionButtons();
  };

  const stopAndRedraw = async (): Promise<void> => {
    stopAnimation();
    await draw();
  };

  const frameGroupSelect = document.getElementById('texture-frame-group-select') as HTMLSelectElement | null;
  frameGroupSelect?.addEventListener('change', async () => {
    state.frameGroupIndex = parseInt(frameGroupSelect.value, 10) || 0;
    state.direction = 0;
    state.addon = 0;
    state.mount = 0;
    state.frame = 0;
    refreshPreviewControls();
    populateCommonForm(getCurrentSpriteInfo());
    populateAnimationForm(getCurrentSpriteInfo());
    populateBoundingBoxes(getCurrentSpriteInfo());
    await stopAndRedraw();
  });

  document.getElementById('outfit-direction-controls')?.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('texture-direction-btn')) return;
    const direction = Number(target.dataset.direction || '0');
    state.direction = direction;
    refreshPreviewControls();
    await stopAndRedraw();
  });

  const addonSlider = document.getElementById('outfit-addon-slider') as HTMLInputElement | null;
  addonSlider?.addEventListener('input', async () => {
    state.addon = Number(addonSlider.value || '0');
    const addonLabel = document.getElementById('outfit-addon-label');
    if (addonLabel) addonLabel.textContent = `Addon ${state.addon}`;
    await stopAndRedraw();
  });

  const frameSlider = document.getElementById('outfit-frame-slider') as HTMLInputElement | null;
  frameSlider?.addEventListener('input', async () => {
    state.frame = Number(frameSlider.value || '0');
    const frameLabel = document.getElementById('outfit-frame-label');
    if (frameLabel) frameLabel.textContent = `Frame ${state.frame + 1}`;
    await stopAndRedraw();
  });

  const mountToggle = document.getElementById('outfit-mount-toggle') as HTMLInputElement | null;
  mountToggle?.addEventListener('change', async () => {
    state.mount = mountToggle.checked ? 1 : 0;
    await stopAndRedraw();
  });

  const bindColorInput = (id: string, setter: (value: string) => void): void => {
    const input = document.getElementById(id) as HTMLInputElement | null;
    input?.addEventListener('input', async () => {
      setter(input.value);
      await stopAndRedraw();
    });
  };

  bindColorInput('outfit-color-head', (value) => { state.headColor = value; });
  bindColorInput('outfit-color-body', (value) => { state.bodyColor = value; });
  bindColorInput('outfit-color-legs', (value) => { state.legsColor = value; });
  bindColorInput('outfit-color-feet', (value) => { state.feetColor = value; });
  bindColorInput('outfit-background-color', (value) => { state.backgroundColor = value; });

  const blendToggle = document.getElementById('outfit-blend-layers') as HTMLInputElement | null;
  blendToggle?.addEventListener('change', async () => {
    state.blendLayers = !!blendToggle.checked;
    await stopAndRedraw();
  });

  const fullAddonToggle = document.getElementById('outfit-full-addons') as HTMLInputElement | null;
  fullAddonToggle?.addEventListener('change', async () => {
    state.showFullAddons = !!fullAddonToggle.checked;
    refreshPreviewControls();
    await stopAndRedraw();
  });

  const bboxToggle = document.getElementById('outfit-show-bboxes') as HTMLInputElement | null;
  bboxToggle?.addEventListener('change', async () => {
    state.showBoundingBoxes = !!bboxToggle.checked;
    await stopAndRedraw();
  });

  const autoAnimateToggle = document.getElementById('outfit-auto-animate') as HTMLInputElement | null;
  autoAnimateToggle?.addEventListener('change', async () => {
    state.autoAnimate = !!autoAnimateToggle.checked;
    stopAnimation();
    if (state.autoAnimate) {
      const spriteInfo = getCurrentSpriteInfo();
      const frameCount = getFrameCount(spriteInfo);
      if (spriteInfo && frameCount > 1) {
        const duration = ensureNumber(spriteInfo.animation?.phases?.[state.frame]?.duration_min, 250);
        animationTimer = window.setInterval(async () => {
          state.frame = (state.frame + 1) % frameCount;
          const slider = document.getElementById('outfit-frame-slider') as HTMLInputElement | null;
          if (slider) {
            slider.value = String(state.frame);
            const frameLabel = document.getElementById('outfit-frame-label');
            if (frameLabel) frameLabel.textContent = `Frame ${state.frame + 1}`;
          }
          await draw();
        }, Math.max(50, duration));
      }
    } else {
      await draw();
    }
  });

  const animationFrameInput = document.getElementById('texture-animation-frame-count') as HTMLInputElement | null;
  animationFrameInput?.addEventListener('change', () => {
    const newCount = Number(animationFrameInput.value || '0');
    updateAnimationPhaseRows(newCount, getCurrentSpriteInfo()?.animation);
  });

  const boundingBody = document.getElementById('texture-bounding-box-body');
  boundingBody?.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('texture-remove-box')) {
      const row = target.closest('tr');
      row?.remove();
      await stopAndRedraw();
    }
  });

  boundingBody?.addEventListener('input', async (event) => {
    const target = event.target as HTMLElement;
    if (!(target instanceof HTMLInputElement)) return;
    const classes = ['texture-box-x', 'texture-box-y', 'texture-box-width', 'texture-box-height'];
    if (classes.some((cls) => target.classList.contains(cls))) {
      await stopAndRedraw();
    }
  });

  const addBoundingButton = document.getElementById('texture-add-bounding-box') as HTMLButtonElement | null;
  addBoundingButton?.addEventListener('click', async () => {
    const body = document.getElementById('texture-bounding-box-body') as HTMLTableSectionElement | null;
    if (!body) return;
    if (body.querySelector('.texture-empty-row')) {
      body.innerHTML = '';
    }
    const rowIndex = body.querySelectorAll('tr').length;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${rowIndex + 1}</td>
      <td><input type="number" class="texture-box-x" value="0" min="0" /></td>
      <td><input type="number" class="texture-box-y" value="0" min="0" /></td>
      <td><input type="number" class="texture-box-width" value="32" min="0" /></td>
      <td><input type="number" class="texture-box-height" value="32" min="0" /></td>
      <td><button type="button" class="texture-remove-box">✕</button></td>
    `;
    body.appendChild(row);
    await stopAndRedraw();
  });

  const boundingSquareInput = document.getElementById('texture-bounding-square') as HTMLInputElement | null;
  boundingSquareInput?.addEventListener('input', async () => {
    await stopAndRedraw();
  });

  const saveButton = document.getElementById('texture-save-button') as HTMLButtonElement | null;
  saveButton?.addEventListener('click', async () => {
    const update = collectTextureUpdatePayload(state.frameGroupIndex);
    await saveTextureSettings(category, details.id, update, saveButton);
  });

  populateCommonForm(getCurrentSpriteInfo());
  populateAnimationForm(getCurrentSpriteInfo());
  populateBoundingBoxes(getCurrentSpriteInfo());
  refreshPreviewControls();
  await draw();
}

async function renderObjectTextureTab(container: HTMLElement, details: CompleteAppearanceItem, category: string): Promise<void> {
  container.innerHTML = `
    <div class="texture-layout">
      <div class="texture-preview-column">
        <div class="texture-preview-card">
          <canvas id="object-preview-canvas" width="96" height="96"></canvas>
        </div>
        <div class="texture-preview-controls">
          <div class="texture-control-row">
            <label>Frame Group
              <select id="texture-frame-group-select">
                ${details.frame_groups.map((_, index) => `<option value="${index}">Group ${index + 1}</option>`).join('')}
              </select>
            </label>
          </div>
          <div class="texture-control-row">
            <label>Pattern X<input type="number" id="object-preview-pattern-x" min="0" value="0" /></label>
            <label>Pattern Y<input type="number" id="object-preview-pattern-y" min="0" value="0" /></label>
          </div>
          <div class="texture-control-row">
            <label>Pattern Z<input type="number" id="object-preview-pattern-z" min="0" value="0" /></label>
            <label>Layer<input type="number" id="object-preview-layer" min="0" value="0" /></label>
          </div>
          <div class="texture-control-row">
            <label>Frame<input type="number" id="object-preview-frame" min="0" value="0" /></label>
            <label class="texture-checkbox"><input type="checkbox" id="object-preview-show-bboxes" checked /> Show bounding boxes</label>
          </div>
        </div>
      </div>
      <div class="texture-settings-column">
        ${buildCommonFormHTML()}
      </div>
    </div>
  `;

  const canvas = document.getElementById('object-preview-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const sprites = await getAppearanceSprites(category, details.id);
  const imageCache: ImageCache = new Map();
  const loadImage = createImageLoader();
  const groupOffsets = computeGroupOffsetsFromDetails(details);

  const state: ObjectPreviewState = {
    frameGroupIndex: 0,
    patternX: 0,
    patternY: 0,
    patternZ: 0,
    layer: 0,
    frame: 0,
    showBoundingBoxes: true,
  };

  const getCurrentSpriteInfo = (): CompleteSpriteInfo | undefined => details.frame_groups[state.frameGroupIndex]?.sprite_info;

  const draw = async (): Promise<void> => {
    const spriteInfo = getCurrentSpriteInfo();
    if (!spriteInfo) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const baseOffset = groupOffsets[state.frameGroupIndex] ?? 0;
    const patternWidth = Math.max(1, ensureNumber(spriteInfo.pattern_width, 1));
    const patternHeight = Math.max(1, ensureNumber(spriteInfo.pattern_height, 1));
    const patternDepth = Math.max(1, ensureNumber(spriteInfo.pattern_depth, 1));
    const layers = Math.max(1, ensureNumber(spriteInfo.layers, 1));
    const frameCount = getFrameCount(spriteInfo);

    state.patternX = clamp(state.patternX, 0, patternWidth - 1);
    state.patternY = clamp(state.patternY, 0, patternHeight - 1);
    state.patternZ = clamp(state.patternZ, 0, patternDepth - 1);
    state.layer = clamp(state.layer, 0, layers - 1);
    state.frame = clamp(state.frame, 0, Math.max(frameCount - 1, 0));

    const aggregatedIndex = baseOffset + computeSpriteIndex(
      spriteInfo,
      state.layer,
      state.patternX,
      state.patternY,
      state.patternZ,
      state.frame
    );

    const image = await loadImage(aggregatedIndex, sprites, imageCache);
    const boxes = getPreviewBoundingBoxes(spriteInfo);
    const boundingSquare = getBoundingSquareValue();
    const { width, height } = computePreviewDimensions(image.width, image.height, boxes, boundingSquare);
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    if (state.showBoundingBoxes) {
      drawBoundingSquareOverlay(ctx, boundingSquare);
      if (boxes.length > 0) {
        const directionIndex = clamp(state.patternX, 0, boxes.length - 1);
        const box = boxes[directionIndex] || boxes[0];
        if (box) {
          ctx.save();
          ctx.strokeStyle = '#00bcd4';
          ctx.lineWidth = 1;
          const x = ensureNumber(box.x, 0);
          const y = ensureNumber(box.y, 0);
          const w = ensureNumber(box.width, 0);
          const h = ensureNumber(box.height, 0);
          if (w > 0 && h > 0) {
            ctx.strokeRect(x, y, w, h);
          }
          ctx.restore();
        }
      }
    }
  };

  const clampInput = (input: HTMLInputElement, max: number): number => {
    const value = Number(input.value || '0');
    const clamped = clamp(value, 0, Math.max(max, 0));
    if (clamped !== value) {
      input.value = String(clamped);
    }
    return clamped;
  };

  const frameGroupSelect = document.getElementById('texture-frame-group-select') as HTMLSelectElement | null;
  frameGroupSelect?.addEventListener('change', async () => {
    state.frameGroupIndex = parseInt(frameGroupSelect.value, 10) || 0;
    state.patternX = 0;
    state.patternY = 0;
    state.patternZ = 0;
    state.layer = 0;
    state.frame = 0;
    populateCommonForm(getCurrentSpriteInfo());
    populateAnimationForm(getCurrentSpriteInfo());
    populateBoundingBoxes(getCurrentSpriteInfo());
    await draw();
  });

  const bindPreviewInput = (id: string, setter: (value: number) => void, maxResolver: () => number): void => {
    const input = document.getElementById(id) as HTMLInputElement | null;
    input?.addEventListener('change', async () => {
      setter(clampInput(input, maxResolver()));
      await draw();
    });
  };

  bindPreviewInput('object-preview-pattern-x', (value) => { state.patternX = value; }, () => Math.max(0, ensureNumber(getCurrentSpriteInfo()?.pattern_width, 1) - 1));
  bindPreviewInput('object-preview-pattern-y', (value) => { state.patternY = value; }, () => Math.max(0, ensureNumber(getCurrentSpriteInfo()?.pattern_height, 1) - 1));
  bindPreviewInput('object-preview-pattern-z', (value) => { state.patternZ = value; }, () => Math.max(0, ensureNumber(getCurrentSpriteInfo()?.pattern_depth, 1) - 1));
  bindPreviewInput('object-preview-layer', (value) => { state.layer = value; }, () => Math.max(0, ensureNumber(getCurrentSpriteInfo()?.layers, 1) - 1));
  bindPreviewInput('object-preview-frame', (value) => { state.frame = value; }, () => Math.max(0, getFrameCount(getCurrentSpriteInfo()) - 1));

  const bboxToggle = document.getElementById('object-preview-show-bboxes') as HTMLInputElement | null;
  bboxToggle?.addEventListener('change', async () => {
    state.showBoundingBoxes = !!bboxToggle.checked;
    await draw();
  });

  const animationFrameInput = document.getElementById('texture-animation-frame-count') as HTMLInputElement | null;
  animationFrameInput?.addEventListener('change', () => {
    const newCount = Number(animationFrameInput.value || '0');
    updateAnimationPhaseRows(newCount, getCurrentSpriteInfo()?.animation);
  });

  const boundingBody = document.getElementById('texture-bounding-box-body');
  boundingBody?.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('texture-remove-box')) {
      const row = target.closest('tr');
      row?.remove();
      await draw();
    }
  });

  boundingBody?.addEventListener('input', async (event) => {
    const target = event.target as HTMLElement;
    if (!(target instanceof HTMLInputElement)) return;
    const classes = ['texture-box-x', 'texture-box-y', 'texture-box-width', 'texture-box-height'];
    if (classes.some((cls) => target.classList.contains(cls))) {
      await draw();
    }
  });

  const addBoundingButton = document.getElementById('texture-add-bounding-box') as HTMLButtonElement | null;
  addBoundingButton?.addEventListener('click', async () => {
    const body = document.getElementById('texture-bounding-box-body') as HTMLTableSectionElement | null;
    if (!body) return;
    if (body.querySelector('.texture-empty-row')) {
      body.innerHTML = '';
    }
    const rowIndex = body.querySelectorAll('tr').length;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${rowIndex + 1}</td>
      <td><input type="number" class="texture-box-x" value="0" min="0" /></td>
      <td><input type="number" class="texture-box-y" value="0" min="0" /></td>
      <td><input type="number" class="texture-box-width" value="32" min="0" /></td>
      <td><input type="number" class="texture-box-height" value="32" min="0" /></td>
      <td><button type="button" class="texture-remove-box">✕</button></td>
    `;
    body.appendChild(row);
    await draw();
  });

  const boundingSquareInput = document.getElementById('texture-bounding-square') as HTMLInputElement | null;
  boundingSquareInput?.addEventListener('input', async () => {
    await draw();
  });

  const saveButton = document.getElementById('texture-save-button') as HTMLButtonElement | null;
  saveButton?.addEventListener('click', async () => {
    const update = collectTextureUpdatePayload(state.frameGroupIndex);
    await saveTextureSettings(category, details.id, update, saveButton);
  });

  populateCommonForm(getCurrentSpriteInfo());
  populateAnimationForm(getCurrentSpriteInfo());
  populateBoundingBoxes(getCurrentSpriteInfo());
  await draw();
}

