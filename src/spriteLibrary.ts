import { getSpriteById, getCachedSpriteById } from './spriteCache';
import { getSpriteUrl as getUnifiedSpriteUrl } from './utils/spriteUrlCache';
import { translate } from './i18n';
import { showStatus } from './utils';

const drawerId = 'sprite-library-drawer';
const closeButtonId = 'sprite-library-close';
const searchInputId = 'sprite-library-search';
const searchButtonId = 'sprite-library-search-btn';
const loadButtonId = 'sprite-library-load';
const listId = 'sprite-library-list';
const startInputId = 'sprite-library-start';
const sizeInputId = 'sprite-library-size';
const orderButtonId = 'sprite-library-order';
const prevButtonId = 'sprite-library-prev';
const nextButtonId = 'sprite-library-next';

let visibleRange: number[] = [];
let isEnabled = false;
let pageStart = 1;
let pageSize = 100;
let order: 'asc' | 'desc' = 'asc';
let hasLoadedSprites = false;

// Virtual scrolling state
let itemHeight = 80; // altura estimada de cada item em px
let visibleStartIndex = 0;
let visibleEndIndex = 0;
let renderTimeout: number | null = null;
const librarySelection = new Set<number>();

function updateLibrarySelectionStyles(): void {
  const chips = document.querySelectorAll<HTMLButtonElement>('.sprite-library-chip');
  chips.forEach((chip) => {
    const id = Number(chip.dataset.spriteId);
    if (Number.isFinite(id) && librarySelection.has(id)) {
      chip.classList.add('is-selected');
    } else {
      chip.classList.remove('is-selected');
    }
  });
}

function parseSpriteIdInput(raw: string): number[] {
  if (!raw) return [];
  const ids: number[] = [];
  raw.split(',').forEach((part) => {
    const token = part.trim();
    if (!token) return;
    const rangeMatch = token.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        for (let i = start; i <= end && ids.length < 1000; i += 1) {
          ids.push(i);
        }
      }
      return;
    }
    const value = Number(token);
    if (Number.isFinite(value)) {
      ids.push(value);
    }
  });
  return Array.from(new Set(ids));
}

function getElements() {
  return {
    drawer: document.getElementById(drawerId),
    backdrop: document.querySelector(`#${drawerId} .sprite-library-backdrop`) as HTMLElement | null,
    panel: document.querySelector(`#${drawerId} .sprite-library-panel`) as HTMLElement | null,
    closeBtn: document.getElementById(closeButtonId),
    searchInput: document.getElementById(searchInputId) as HTMLInputElement | null,
    searchBtn: document.getElementById(searchButtonId),
    loadBtn: document.getElementById(loadButtonId),
    startInput: document.getElementById(startInputId) as HTMLInputElement | null,
    sizeInput: document.getElementById(sizeInputId) as HTMLInputElement | null,
    orderBtn: document.getElementById(orderButtonId),
    prevBtn: document.getElementById(prevButtonId),
    nextBtn: document.getElementById(nextButtonId),
    list: document.getElementById(listId) as HTMLElement | null,
  };
}

function getSpriteUrl(id: number): string | null {
  const data = getCachedSpriteById(id);
  if (!data) return null;
  return getUnifiedSpriteUrl(data);
}

function calculateVisibleRange(scrollTop: number, containerHeight: number): void {
  const bufferSize = Math.ceil(containerHeight / itemHeight) * 2; // 2x buffer para smooth scroll
  visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - Math.floor(bufferSize / 4));
  visibleEndIndex = Math.min(visibleRange.length - 1, visibleStartIndex + bufferSize);
  visibleStartIndex = Math.max(0, visibleEndIndex - bufferSize);
}

function renderVirtualList(): void {
  const { list } = getElements();
  if (!list) return;

  if (visibleRange.length === 0) {
    list.innerHTML = `<div class="sprite-library-empty" data-i18n="texture.library.empty">${translate('texture.library.empty')}</div>`;
    return;
  }

  // Se não tiver muitos itens, usa render normal
  if (visibleRange.length <= 500) {
    renderNormalList();
    return;
  }

  const scrollTop = list.scrollTop;
  const containerHeight = list.clientHeight;
  
  calculateVisibleRange(scrollTop, containerHeight);
  
  // Criar container com altura total
  const totalHeight = visibleRange.length * itemHeight;
  list.innerHTML = `<div style="height: ${totalHeight}px; position: relative;"></div>`;
  const container = list.firstElementChild;
  
  if (!container) return;
  
  // Renderizar apenas itens visíveis
  const fragment = document.createDocumentFragment();
  
  for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
    const id = visibleRange[i];
    const cachedUrl = getSpriteUrl(id);
    const button = createSpriteButton(id, cachedUrl);
    button.style.position = 'absolute';
    button.style.top = `${i * itemHeight}px`;
    button.style.width = '100%';
    button.style.height = `${itemHeight}px`;
    fragment.appendChild(button);
  }
  
  container.appendChild(fragment);
}

function createSpriteButton(id: number, cachedUrl: string | null): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.draggable = !!cachedUrl;
  button.className = 'texture-sprite-chip sprite-library-chip';
  if (librarySelection.has(id)) {
    button.classList.add('is-selected');
  }
  button.dataset.spriteId = String(id);
  button.innerHTML = `
    <div class="texture-sprite-thumb">
      ${cachedUrl ? `<img src="${cachedUrl}" alt="Sprite ${id}">` : '<div class="texture-sprite-placeholder">…</div>'}
    </div>
    <div class="texture-sprite-meta">
      <span class="texture-sprite-id">#${id}</span>
      <span class="texture-sprite-slot">${translate('texture.spriteList.slotLabel', { value: id })}</span>
    </div>
  `;

  button.addEventListener('click', (event) => {
    const multiSelect = event.ctrlKey || event.metaKey;
    if (!multiSelect) {
      librarySelection.clear();
      librarySelection.add(id);
      updateLibrarySelectionStyles();
      return;
    }

    if (librarySelection.has(id)) {
      librarySelection.delete(id);
    } else {
      librarySelection.add(id);
    }
    updateLibrarySelectionStyles();
  });

  button.addEventListener('dragstart', (event) => {
    if (!event.dataTransfer || !cachedUrl) return;
    if (!librarySelection.has(id)) {
      librarySelection.clear();
      librarySelection.add(id);
    }
    const spriteIds = Array.from(librarySelection).sort((a, b) => a - b);
    const payload = { spriteIds };
    event.dataTransfer.setData('application/x-asset-sprite', JSON.stringify(payload));
    event.dataTransfer.setData('text/plain', spriteIds.join(','));
    event.dataTransfer.effectAllowed = 'copy';
    updateLibrarySelectionStyles();
  });

  return button;
}

function renderNormalList(): void {
  const { list } = getElements();
  if (!list) return;

  list.innerHTML = '';
  const fragment = document.createDocumentFragment();
  visibleRange.forEach((id) => {
    const cachedUrl = getSpriteUrl(id);
    const button = createSpriteButton(id, cachedUrl);
    fragment.appendChild(button);
  });

  list.appendChild(fragment);
  updateLibrarySelectionStyles();
}

function renderList(): void {
  // Cancelar renderização pendente
  if (renderTimeout) {
    cancelAnimationFrame(renderTimeout);
  }
  
  // Usar requestAnimationFrame para performance
  renderTimeout = requestAnimationFrame(() => {
    if (visibleRange.length > 500) {
      renderVirtualList();
    } else {
      renderNormalList();
    }
  });
}

function updateButtonVisibility(): void {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  drawer.style.display = isEnabled ? '' : 'none';
}

async function loadSprites(rawInput: string): Promise<void> {
  const ids = parseSpriteIdInput(rawInput);
  if (ids.length === 0) {
    showStatus(translate('status.spriteDropInvalid'), 'error');
    return;
  }
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.some(id => !!getCachedSpriteById(id))) {
    hasLoadedSprites = true;
  }
  visibleRange = uniqueIds;
  renderList();

  let loaded = 0;
  for (const id of uniqueIds) {
    if (getCachedSpriteById(id)) continue;
    const data = await getSpriteById(id);
    if (data) {
      loaded += 1;
      hasLoadedSprites = true;
      renderList();
    }
  }

  if (loaded > 0) {
    showStatus(translate('status.spriteLibraryLoaded', { count: loaded }), 'success');
  }
}

function updateOrderButtonText(): void {
  const { orderBtn } = getElements();
  if (!orderBtn) return;
  if (order === 'asc') {
    orderBtn.textContent = translate('texture.library.order.asc');
    orderBtn.dataset.order = 'asc';
  } else {
    orderBtn.textContent = translate('texture.library.order.desc');
    orderBtn.dataset.order = 'desc';
  }
}

function loadInputsFromUI(): void {
  const { startInput, sizeInput } = getElements();
  if (startInput) {
    const parsed = Number(startInput.value || '1');
    pageStart = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    startInput.value = String(pageStart);
  }
  if (sizeInput) {
    const parsed = Number(sizeInput.value || '100');
    pageSize = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 500) : 100;
    sizeInput.value = String(pageSize);
  }
}

async function loadPageFromState(): Promise<void> {
  const ids: number[] = [];
  const start = Math.max(1, pageStart);
  if (order === 'asc') {
    for (let i = 0; i < pageSize; i += 1) ids.push(start + i);
  } else {
    for (let i = 0; i < pageSize; i += 1) ids.push(Math.max(1, start - i));
  }
  if (ids.length === 0) return;

  if (ids.some(id => !!getCachedSpriteById(id))) {
    hasLoadedSprites = true;
  }
  visibleRange = ids;
  renderList();

  let loaded = 0;
  for (const id of ids) {
    if (getCachedSpriteById(id)) continue;
    const data = await getSpriteById(id);
    if (data) {
      loaded += 1;
      hasLoadedSprites = true;
      renderList();
    }
  }

  if (loaded > 0) {
    showStatus(translate('status.spriteLibraryLoaded', { count: loaded }), 'success');
  }
}

function goToNextPage(): void {
  loadInputsFromUI();
  if (order === 'asc') {
    pageStart = Math.max(1, pageStart + pageSize);
  } else {
    pageStart = Math.max(1, pageStart - pageSize);
  }
  const { startInput } = getElements();
  if (startInput) startInput.value = String(pageStart);
  void loadPageFromState();
}

function goToPrevPage(): void {
  loadInputsFromUI();
  if (order === 'asc') {
    pageStart = Math.max(1, pageStart - pageSize);
  } else {
    pageStart = pageStart + pageSize;
  }
  const { startInput } = getElements();
  if (startInput) startInput.value = String(pageStart);
  void loadPageFromState();
}

function toggleDrawer(force?: boolean): void {
  const { drawer, panel, searchInput } = getElements();
  if (!drawer || !panel || !isEnabled) return;
  const shouldOpen = force !== undefined ? force : !drawer.classList.contains('is-open');
  drawer.classList.toggle('is-open', shouldOpen);
  drawer.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  if (shouldOpen) {
    searchInput?.focus();
  }
}

export function initSpriteLibraryUI(): void {
  const { backdrop, closeBtn, searchInput, searchBtn, loadBtn, startInput, sizeInput, orderBtn, prevBtn, nextBtn, list } = getElements();

  closeBtn?.addEventListener('click', () => toggleDrawer(false));
  backdrop?.addEventListener('click', () => toggleDrawer(false));

  // Virtual scroll listener
  list?.addEventListener('scroll', () => {
    if (visibleRange.length > 500) {
      renderList();
    }
  }, { passive: true });

  loadBtn?.addEventListener('click', async () => {
    loadInputsFromUI();
    await loadPageFromState();
  });

  searchBtn?.addEventListener('click', async () => {
    if (!searchInput) return;
    await loadSprites(searchInput.value);
  });

  searchInput?.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await loadSprites(searchInput.value);
    }
  });

  startInput?.addEventListener('change', () => loadInputsFromUI());
  sizeInput?.addEventListener('change', () => loadInputsFromUI());

  orderBtn?.addEventListener('click', () => {
    order = order === 'asc' ? 'desc' : 'asc';
    updateOrderButtonText();
    void loadPageFromState();
  });

  prevBtn?.addEventListener('click', () => {
    goToPrevPage();
  });

  nextBtn?.addEventListener('click', () => {
    goToNextPage();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      toggleDrawer(false);
    }
  });

  renderList();
  updateButtonVisibility();
}

export function setSpriteLibraryEnabled(enabled: boolean): void {
  isEnabled = enabled;
  if (!enabled) {
    toggleDrawer(false);
  }
  document.body.classList.toggle('sprite-library-open', enabled);
  updateButtonVisibility();
  if (enabled) {
    toggleDrawer(true);
    if (!hasLoadedSprites || visibleRange.length === 0) {
      void loadPageFromState();
    } else {
      renderList();
    }
  }
}
