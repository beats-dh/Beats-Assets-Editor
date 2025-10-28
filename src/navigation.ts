import { invoke } from '@tauri-apps/api/core';
import type { AppearanceStats } from './types';
import { getCategoryInfo } from './utils';
import { loadAssets, setCurrentCategory, setCurrentSubcategory, setCurrentPage, setCurrentSearch } from './assetUI';
import { stopAllAnimationPlayers } from './animation';
import { clearAssetSelection } from './assetSelection';

let currentView = 'main';
let currentStats: AppearanceStats | null = null;

export function getCurrentView(): string {
  return currentView;
}

export function setCurrentView(view: string): void {
  currentView = view;
}

export function getCurrentStats(): AppearanceStats | null {
  return currentStats;
}

export function setCurrentStats(stats: AppearanceStats): void {
  currentStats = stats;
}

export function showMainApp(): void {
  const loadingScreen = document.querySelector('#loading-screen') as HTMLElement;
  const mainApp = document.querySelector('#main-app') as HTMLElement;

  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }

  if (mainApp) {
    mainApp.style.display = 'block';
  }

  updateHeaderStats();
}

export function updateHeaderStats(): void {
  const objectsCount = document.getElementById('objects-count');
  const outfitsCount = document.getElementById('outfits-count');
  const effectsCount = document.getElementById('effects-count');
  const missilesCount = document.getElementById('missiles-count');
  const soundsCount = document.getElementById('sounds-count');

  if (objectsCount && currentStats) {
    objectsCount.textContent = `${currentStats.object_count} itens`;
  }
  if (outfitsCount && currentStats) {
    outfitsCount.textContent = `${currentStats.outfit_count} itens`;
  }
  if (effectsCount && currentStats) {
    effectsCount.textContent = `${currentStats.effect_count} itens`;
  }
  if (missilesCount && currentStats) {
    missilesCount.textContent = `${currentStats.missile_count} itens`;
  }
  // Sounds count will be loaded separately
  if (soundsCount) {
    // Will be updated when sounds are loaded
  }
}

export function openCategory(category: string): void {
  setCurrentCategory(category);
  currentView = 'category';
  setCurrentPage(0);
  setCurrentSearch('');
  setCurrentSubcategory('All');
  clearAssetSelection();

  const appHeader = document.querySelector('.app-header') as HTMLElement;
  const categoryNav = document.querySelector('.category-nav') as HTMLElement;
  const categoryView = document.querySelector('#category-view') as HTMLElement;

  if (appHeader) appHeader.style.display = 'none';
  if (categoryNav) categoryNav.style.display = 'none';
  if (categoryView) categoryView.style.display = 'block';

  // Show/hide subcategory selector based on category
  const subcategoryContainer = document.getElementById('subcategory-container') as HTMLElement | null;
  if (subcategoryContainer) {
    if (category === 'Objects' || category === 'Sounds') {
      subcategoryContainer.style.display = 'flex';
    } else {
      subcategoryContainer.style.display = 'none';
    }
  }

  updateCategoryHeader(category);
  renderSubcategoryOptions(category);
  loadAssets();
}

export { loadAssets };

export function openCategoryWithSubcategory(category: string, subcategory: string): void {
  setCurrentCategory(category);
  setCurrentSubcategory(subcategory);
  currentView = 'category';
  setCurrentPage(0);
  setCurrentSearch('');
  clearAssetSelection();

  const appHeader = document.querySelector('.app-header') as HTMLElement;
  const categoryNav = document.querySelector('.category-nav') as HTMLElement;
  const categoryView = document.querySelector('#category-view') as HTMLElement;

  if (appHeader) appHeader.style.display = 'none';
  if (categoryNav) categoryNav.style.display = 'none';
  if (categoryView) categoryView.style.display = 'block';

  // Show/hide subcategory selector based on category
  const subcategoryContainer = document.getElementById('subcategory-container') as HTMLElement | null;
  if (subcategoryContainer) {
    if (category === 'Objects' || category === 'Sounds') {
      subcategoryContainer.style.display = 'flex';
    } else {
      subcategoryContainer.style.display = 'none';
    }
  }

  updateCategoryHeader(category);
  renderSubcategoryOptions(category);

  const subcategorySelect = document.getElementById('subcategory-select') as HTMLSelectElement;
  if (subcategorySelect) {
    subcategorySelect.value = subcategory;
  }

  loadAssets();
}

export function goBack(): void {
  if (currentView === 'category') {
    currentView = 'main';
    setCurrentCategory('Objects');
    clearAssetSelection();

    const categoryView = document.querySelector('#category-view') as HTMLElement;
    const appHeader = document.querySelector('.app-header') as HTMLElement;
    const categoryNav = document.querySelector('.category-nav') as HTMLElement;

    if (categoryView) categoryView.style.display = 'none';
    if (appHeader) appHeader.style.display = 'block';
    if (categoryNav) categoryNav.style.display = 'block';
  }
}

function updateCategoryHeader(category: string): void {
  const categoryInfo = getCategoryInfo(category);

  const viewIcon = document.querySelector('.view-icon') as HTMLElement;
  const viewTitle = document.querySelector('.view-info h2') as HTMLElement;
  const viewSubtitle = document.querySelector('.view-subtitle') as HTMLElement;

  if (viewIcon) viewIcon.textContent = categoryInfo.icon;
  if (viewTitle) viewTitle.textContent = categoryInfo.title;
  if (viewSubtitle) viewSubtitle.textContent = categoryInfo.description;
}

function renderSubcategoryOptions(category: string): void {
  const subcategorySelect = document.getElementById('subcategory-select') as HTMLSelectElement;
  if (!subcategorySelect) return;

  subcategorySelect.innerHTML = '';

  if (category === 'Objects') {
    invoke<[string, string][]>('get_item_subcategories')
      .then((subcategories) => {
        subcategories.forEach(([value, label]) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = label;
          subcategorySelect.appendChild(option);
        });
      })
      .catch((err) => {
        console.error('Erro ao carregar subcategorias:', err);
        const option = document.createElement('option');
        option.value = 'All';
        option.textContent = 'Todas as subcategorias';
        subcategorySelect.appendChild(option);
      });
  } else if (category === 'Sounds') {
    // Load sound types as subcategories
    invoke<string[]>('list_sound_types')
      .then((soundTypes) => {
        // Add "All" option first
        const allOption = document.createElement('option');
        allOption.value = 'All';
        allOption.textContent = 'Todos os tipos';
        subcategorySelect.appendChild(allOption);

        // Add each sound type as a subcategory
        soundTypes.forEach((soundType) => {
          const option = document.createElement('option');
          option.value = soundType;
          option.textContent = soundType;
          subcategorySelect.appendChild(option);
        });

        // Add special groups for streams/templates
        const ambienceOption = document.createElement('option');
        ambienceOption.value = 'Ambience Streams';
        ambienceOption.textContent = 'Ambience Streams';
        subcategorySelect.appendChild(ambienceOption);

        const ambienceObjOption = document.createElement('option');
        ambienceObjOption.value = 'Ambience Object Streams';
        ambienceObjOption.textContent = 'Ambience Object Streams';
        subcategorySelect.appendChild(ambienceObjOption);

        const musicTemplateOption = document.createElement('option');
        musicTemplateOption.value = 'Music Templates';
        musicTemplateOption.textContent = 'Music Templates';
        subcategorySelect.appendChild(musicTemplateOption);
      })
      .catch((err) => {
        console.error('Erro ao carregar tipos de sons:', err);
        const option = document.createElement('option');
        option.value = 'All';
        option.textContent = 'Todos os tipos';
        subcategorySelect.appendChild(option);

        // Fallback: still add special groups
        ['Ambience Streams', 'Ambience Object Streams', 'Music Templates'].forEach((label) => {
          const opt = document.createElement('option');
          opt.value = label;
          opt.textContent = label;
          subcategorySelect.appendChild(opt);
        });
      });
  } else {
    const option = document.createElement('option');
    option.value = 'All';
    option.textContent = 'Todas as subcategorias';
    subcategorySelect.appendChild(option);
  }
}

export function showSetupSection(): void {
  const loadingProgress = document.querySelector('.loading-progress') as HTMLElement;
  const setupSection = document.getElementById('setup-section');

  if (loadingProgress) loadingProgress.style.display = 'none';
  if (setupSection) {
    setupSection.classList.add('show');
    setupSection.style.display = 'block';
  }
}

export function goHome(): void {
  const assetDetails = document.querySelector('#asset-details') as HTMLElement | null;
  if (assetDetails && assetDetails.classList.contains('show')) {
    assetDetails.classList.remove('show');
    assetDetails.style.display = 'none';
  }

  stopAllAnimationPlayers();

  const loadingScreen = document.querySelector('#loading-screen') as HTMLElement | null;
  const mainApp = document.querySelector('#main-app') as HTMLElement | null;

  if (mainApp) {
    mainApp.style.display = 'none';
  }
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
  }

  showSetupSection();
  currentView = 'main';
}
