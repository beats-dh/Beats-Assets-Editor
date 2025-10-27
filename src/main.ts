import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";

// Extend Window interface to include debugCache
declare global {
  interface Window {
    debugCache: {
      getFrontendCacheStats: () => any;
      getBackendCacheStats: () => Promise<any>;
      clearFrontendCache: () => string;
      clearBackendCache: () => Promise<string>;
      clearAllCaches: () => Promise<string>;
      testCache: (category: string, id: number) => Promise<any>;
    };
  }
}

interface AppearanceStats {
  // Primary counts (last IDs - like Assets Editor)
  object_count: number;
  outfit_count: number;
  effect_count: number;
  missile_count: number;
  // Additional info - actual item counts in file
  actual_objects: number;
  actual_outfits: number;
  actual_effects: number;
  actual_missiles: number;
}

// Complete appearance types matching Rust backend
interface CompleteAppearanceItem {
  id: number;
  name?: string;
  description?: string;
  frame_groups: CompleteFrameGroup[];
  flags?: CompleteFlags;
}

interface CompleteFrameGroup {
  fixed_frame_group?: number;
  id?: number;
  sprite_info?: CompleteSpriteInfo;
}

interface CompleteSpriteInfo {
  pattern_width?: number;
  pattern_height?: number;
  pattern_depth?: number;
  layers?: number;
  // Extra optional pattern fields present from backend mapping
  pattern_layers?: number;
  pattern_x?: number;
  pattern_y?: number;
  pattern_z?: number;
  pattern_frames?: number;
  sprite_ids: number[];
  bounding_square?: number;
  animation?: SpriteAnimation;
  // Flag indicating animation presence
  is_animation?: boolean;
  is_opaque?: boolean;
  bounding_boxes: BoundingBox[];
}

interface SpriteAnimation {
  synchronized?: boolean;
  loop_type?: number;
  loop_count?: number;
  phases: SpritePhase[];
}

interface SpritePhase {
  duration_min?: number;
  duration_max?: number;
}

interface BoundingBox {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface CompleteFlags {
  // Basic boolean flags
  clip?: boolean;
  bottom?: boolean;
  top?: boolean;
  container?: boolean;
  cumulative?: boolean;
  usable?: boolean;
  forceuse?: boolean;
  multiuse?: boolean;
  liquidpool?: boolean;
  unpass?: boolean;
  unmove?: boolean;
  unsight?: boolean;
  avoid?: boolean;
  no_movement_animation?: boolean;
  take?: boolean;
  liquidcontainer?: boolean;
  hang?: boolean;
  rotate?: boolean;
  dont_hide?: boolean;
  translucent?: boolean;
  lying_object?: boolean;
  animate_always?: boolean;
  fullbank?: boolean;
  ignore_look?: boolean;
  wrap?: boolean;
  unwrap?: boolean;
  topeffect?: boolean;
  corpse?: boolean;
  player_corpse?: boolean;
  ammo?: boolean;
  show_off_socket?: boolean;
  reportable?: boolean;
  reverse_addons_east?: boolean;
  reverse_addons_west?: boolean;
  reverse_addons_south?: boolean;
  reverse_addons_north?: boolean;
  wearout?: boolean;
  clockexpire?: boolean;
  expire?: boolean;
  expirestop?: boolean;
  deco_item_kit?: boolean;
  dual_wielding?: boolean;

  // Complex flags
  bank?: { waypoints?: number };
  write?: { max_text_length?: number };
  write_once?: { max_text_length_once?: number };
  hook?: { direction?: number };
  // Hook mount booleans
  hook_south?: boolean;
  hook_east?: boolean;
  light?: { brightness?: number; color?: number };
  shift?: { x?: number; y?: number };
  height?: { elevation?: number };
  automap?: { color?: number };
  lenshelp?: { id?: number };
  clothes?: { slot?: number };
  default_action?: { action?: number };
  market?: {
    category?: number;
    trade_as_object_id?: number;
    show_as_object_id?: number;
    restrict_to_vocation: number[];
    minimum_level?: number;
  };
  npc_sale_data: FlagNPC[];
  changed_to_expire?: { former_object_typeid?: number };
  cyclopedia_item?: { cyclopedia_type?: number };
  upgrade_classification?: { upgrade_classification?: number };
  skillwheel_gem?: { gem_quality_id?: number; vocation_id?: number };
  // Extra complex flags
  imbueable?: { slot_count?: number };
  proficiency?: { proficiency_id?: number };
  // Extras
  transparency_level?: number;
}

// Helper para normalização de chaves de flags (snake_case/camelCase/no-underscore)
function getFlagBool(flags: CompleteFlags | undefined, key: string): boolean {
  if (!flags) return false;
  const anyFlags: Record<string, unknown> = flags as any;

  // 1) Tentativa direta
  const direct = anyFlags[key];
  if (typeof direct === 'boolean') return !!direct;

  // 2) CamelCase -> snake_case
  const snake = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  const snakeVal = anyFlags[snake];
  if (typeof snakeVal === 'boolean') return !!snakeVal;

  // 3) Normalização sem underscores/espacos
  const normalized = key.toLowerCase().replace(/[_\s]/g, '');
  for (const k of Object.keys(anyFlags)) {
    if (k.replace(/[_\s]/g, '').toLowerCase() === normalized) {
      const v = anyFlags[k];
      if (typeof v === 'boolean') return !!v;
    }
  }

  return false;
}

interface FlagNPC {
  name?: string;
  location?: string;
  sale_price?: number;
  buy_price?: number;
  currency_object_type_id?: number;
  currency_quest_flag_display_name?: string;
}

let tibiaPathInput: HTMLInputElement | null;
let loadButton: HTMLButtonElement | null;
let statsContainer: HTMLElement | null;
let statusMessage: HTMLElement | null;
let filesList: HTMLElement | null;

// Assets browser elements
let assetsBrowser: HTMLElement | null;
let assetsGrid: HTMLElement | null;
let assetSearch: HTMLInputElement | null;
let itemsCount: HTMLElement | null;
let pageInfo: HTMLElement | null;
let prevPageBtn: HTMLButtonElement | null;
let nextPageBtn: HTMLButtonElement | null;
let pageSizeSelect: HTMLSelectElement | null;
let assetDetails: HTMLElement | null;
let detailsContent: HTMLElement | null;

// Assets browser state
let currentCategory = "Objects";
let currentSubcategory = "All";
let currentPage = 0;
let currentPageSize = 50;
let currentSearch = "";
let totalItems = 0;
let currentStats: AppearanceStats | null = null;
// Keep current appearance details for sprite card animations
let currentAppearanceDetails: CompleteAppearanceItem | null = null;

// Category navigation state
let currentView = 'main';

// Store the Tibia path provided by user
let userTibiaPath: string | null = null;
const LAST_TIBIA_PATH_KEY = 'lastTibiaPath';
let autoAnimateGridEnabled = localStorage.getItem('autoAnimateGridEnabled') === 'true';

async function loadAppearances() {
  if (!tibiaPathInput) return;

  const tibiaPath = tibiaPathInput.value;

  if (!tibiaPath) {
    showStatus("Please enter the Tibia client path", "error");
    return;
  }

  // Store the user's Tibia path for later use
  userTibiaPath = tibiaPath;
  localStorage.setItem(LAST_TIBIA_PATH_KEY, tibiaPath);
  // Persist path no backend para uso entre sessões
  try { await invoke("set_tibia_base_path", { tibiaPath }); } catch (_) {}

  try {
    // List available appearance files
    const files = await invoke<string[]>("list_appearance_files", { tibiaPath });

    if (files.length === 0) {
      showStatus("No appearance files found in the assets directory", "error");
      return;
    }

    displayFilesList(files);

    // Build paths using Tauri's path.join for cross-platform compatibility
    const assetsDir = await join(tibiaPath, "assets");

    // Try to load appearances_latest.dat first (our working copy)
    let appearancePath = await join(assetsDir, "appearances_latest.dat");

    // If that doesn't exist, fall back to the first file
    if (!files.includes("appearances_latest.dat")) {
      appearancePath = await join(assetsDir, files[0]);
    }
  
    const result = await invoke<AppearanceStats>("load_appearances_file", {
      path: appearancePath
    });

    // Show main UI immediately after successfully loading appearances
    displayStats(result);
    showMainApp();

    // Then load grid content; errors here won't block the UI
    showAssetsBrowser();
    await loadAssets();

  } catch (error) {
    console.error('Error loading appearances:', error);
    showStatus(`Error: ${error}`, "error");
  }
}

function displayStats(stats: AppearanceStats) {
  // Save stats for later use
  currentStats = {
    object_count: stats.object_count,
    outfit_count: stats.outfit_count,
    effect_count: stats.effect_count,
    missile_count: stats.missile_count,
    actual_objects: stats.actual_objects,
    actual_outfits: stats.actual_outfits,
    actual_effects: stats.actual_effects,
    actual_missiles: stats.actual_missiles
  };

  // Remover cartões do header: não renderizar stats no topo
  if (statsContainer) {
    statsContainer.innerHTML = "";
    statsContainer.style.display = "none";
  }
}

function displayFilesList(files: string[]) {
  if (!filesList) return;

  filesList.innerHTML = `
    <h3>Available Appearance Files:</h3>
    <ul>
      ${files.map(file => `<li>${file}</li>`).join('')}
    </ul>
  `;
  filesList.style.display = "block";
}

function showStatus(message: string, type: "loading" | "success" | "error") {
  if (!statusMessage) return;

  // Use the toast styles defined in CSS
  statusMessage.textContent = message;
  statusMessage.className = `status-toast ${type}`;
  statusMessage.style.display = "block";
  statusMessage.classList.add("show");

  // Auto-hide non-loading messages after 5s
  if (type !== "loading") {
    setTimeout(() => {
      statusMessage?.classList.remove("show");
      if (statusMessage) statusMessage.style.display = "none";
    }, 5000);
  }
}

async function browseTibiaPath() {
  try {
    const selection = await open({ directory: true, multiple: false });
    // Com multiple: false, o retorno é string | null
    if (typeof selection === 'string' && selection) {
      if (tibiaPathInput) {
        tibiaPathInput.value = selection;
        localStorage.setItem(LAST_TIBIA_PATH_KEY, selection);
        if (loadButton) loadButton.disabled = !tibiaPathInput.value.trim();
      }
    }
    // Se for null (cancelado), não faz nada
  } catch (err) {
    console.error('Falha ao selecionar diretório:', err);
    showStatus('Falha ao abrir seletor de diretório', 'error');
  }
}

// Loading screen functions
async function showLoadingScreen() {
  updateProgress(0, 'Inicializando aplicação...');

  // Simulate loading steps
  await delay(500);
  updateProgress(20, 'Verificando arquivos...');

  await delay(800);
  updateProgress(50, 'Carregando configurações...');

  await delay(600);
  updateProgress(80, 'Preparando interface...');

  await delay(400);
  updateProgress(100, 'Pronto!');

  await delay(500);
  showSetupSection();
}

function updateProgress(percentage: number, text: string) {
  const progressFill = document.getElementById('progress-fill');
  const loadingText = document.getElementById('loading-text');

  if (progressFill) progressFill.style.width = `${percentage}%`;
  if (loadingText) loadingText.textContent = text;
}

function showSetupSection() {
  const loadingProgress = document.querySelector('.loading-progress') as HTMLElement;
  const setupSection = document.getElementById('setup-section');

  // Hide only the progress part, not the entire loading screen
  if (loadingProgress) loadingProgress.style.display = 'none';
  if (setupSection) {
    setupSection.classList.add('show');
    setupSection.style.display = 'block';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

window.addEventListener("DOMContentLoaded", async () => {
  tibiaPathInput = document.querySelector("#tibia-path");
  loadButton = document.querySelector("#load-button");
  statsContainer = document.querySelector("#header-stats");
  statusMessage = document.querySelector("#status-message");
  filesList = document.querySelector("#files-list");

  const savedPath = localStorage.getItem(LAST_TIBIA_PATH_KEY);
  let persistedPath: string | null = null;
  try {
    persistedPath = await invoke<string | null>("get_tibia_base_path");
  } catch (_) {}

  if (tibiaPathInput) {
    const initialPath = persistedPath && persistedPath.trim() ? persistedPath : (savedPath || "");
    tibiaPathInput.value = initialPath;
  }

  // Desabilita o botão até ter um caminho válido
  if (loadButton) {
    loadButton.disabled = !(tibiaPathInput && tibiaPathInput.value.trim());
  }

  // Habilita/Desabilita conforme o usuário digita ou escolhe diretório
  tibiaPathInput?.addEventListener('input', () => {
    if (loadButton && tibiaPathInput) {
      loadButton.disabled = !tibiaPathInput.value.trim();
    }
  });
 
  loadButton?.addEventListener("click", loadAppearances);

  document.querySelector("#browse-dir")?.addEventListener("click", browseTibiaPath);

  // Initialize assets browser elements
  initializeAssetsBrowser();

  // Start loading screen
  await showLoadingScreen();
});

function initializeAssetsBrowser() {
  assetsBrowser = document.querySelector("#assets-browser");
  assetsGrid = document.querySelector("#assets-grid");
  assetSearch = document.querySelector("#asset-search");
  itemsCount = document.querySelector("#results-count");
  pageInfo = document.querySelector("#page-info");
  prevPageBtn = document.querySelector("#prev-page");
  nextPageBtn = document.querySelector("#next-page");
  pageSizeSelect = document.querySelector("#page-size");
  assetDetails = document.querySelector("#asset-details");
  detailsContent = document.querySelector("#details-content");

  const settingsBtn = document.querySelector("#settings-btn") as HTMLButtonElement | null;
  const settingsMenu = document.getElementById('settings-menu') as HTMLElement | null;
  const autoAnimateToggle = document.getElementById('auto-animate-toggle') as HTMLInputElement | null;
  const clearCacheBtn = document.getElementById('clear-cache-btn') as HTMLButtonElement | null;
  const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement | null;
  const homeBtn = document.getElementById('home-btn') as HTMLButtonElement | null;

  if (settingsBtn && settingsMenu) {
    settingsBtn.title = 'Configurações';

    if (autoAnimateToggle) {
      autoAnimateToggle.checked = autoAnimateGridEnabled;
      autoAnimateToggle.addEventListener('change', () => {
        autoAnimateGridEnabled = autoAnimateToggle.checked;
        localStorage.setItem('autoAnimateGridEnabled', String(autoAnimateGridEnabled));
        loadAssets();
      });
    }

    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', async () => {
        await clearAllCaches();
      });
    }


    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        if (assetDetails && assetDetails.classList.contains('show')) {
          closeAssetDetails();
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
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        try {
          const stats = await invoke<AppearanceStats>('get_appearance_stats');
          displayStats(stats);
          updateHeaderStats();
        } catch (error) {
          console.error('Error refreshing stats:', error);
        }

        // Reload assets grid
        await loadAssets();

        // Refresh asset details modal if it is open
        if (assetDetails && assetDetails.classList.contains('show') && currentAppearanceDetails) {
          await refreshAssetDetails(currentCategory, currentAppearanceDetails.id);
        }
      });
    }

    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!settingsMenu.contains(target) && target !== settingsBtn) {
        settingsMenu.style.display = 'none';
      }
    });
  }

  // Category tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const target = e.target as HTMLButtonElement;
      const category = target.dataset.category;
      if (category) {
        switchCategory(category);
      }
    });
  });

  // Search functionality
  document.querySelector("#search-btn")?.addEventListener("click", performSearch);
  document.querySelector("#clear-search")?.addEventListener("click", clearSearch);
  assetSearch?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });

  // Pagination
  prevPageBtn?.addEventListener("click", () => changePage(currentPage - 1));
  nextPageBtn?.addEventListener("click", () => changePage(currentPage + 1));
  pageSizeSelect?.addEventListener("change", (e) => {
    const target = e.target as HTMLSelectElement;
    currentPageSize = parseInt(target.value);
    currentPage = 0;
    loadAssets();
  });

  // Subcategory selection
  document.querySelector("#subcategory-select")?.addEventListener("change", (e) => {
    const target = e.target as HTMLSelectElement;
    switchSubcategory(target.value);
  });

  // Close details
  document.querySelector("#close-details")?.addEventListener("click", closeAssetDetails);
}

function showAssetsBrowser() {
  if (assetsBrowser) {
    assetsBrowser.style.display = "block";
  }
}

function showMainApp() {
  const loadingScreen = document.querySelector('#loading-screen') as HTMLElement;
  const mainApp = document.querySelector('#main-app') as HTMLElement;
  
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
  
  if (mainApp) {
    mainApp.style.display = 'block';
  }
  
  updateHeaderStats();
  setupCategoryListeners();
}

function setupCategoryListeners() {
  // Add global click listener for category navigation
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    console.log('Global click detected on:', target);

    // Handle category card clicks
    if (target.closest('.category-card')) {
      console.log('Category card clicked');
      const categoryCard = target.closest('.category-card') as HTMLElement;
      const category = categoryCard.dataset.category;
      if (category) {
        openCategory(category);
      }
    }

    // Handle subcategory card clicks
    if (target.closest('.subcategory-card')) {
      console.log('Subcategory card clicked');
      const subcatCard = target.closest('.subcategory-card') as HTMLElement;
      const category = subcatCard.dataset.category;
      const subcategory = subcatCard.dataset.subcategory;
      if (category && subcategory) {
        openCategoryWithSubcategory(category, subcategory);
      }
    }

    // Handle asset item clicks
    const assetItem = target.closest('.asset-item');
    if (assetItem) {
      console.log('Asset item clicked!', assetItem);
      const assetId = (assetItem as HTMLElement).dataset.assetId;
      const category = (assetItem as HTMLElement).dataset.category;
      console.log('Asset ID:', assetId, 'Category:', category);
      if (assetId && category) {
        showAssetDetails(category, parseInt(assetId));
      } else {
        console.error('Missing assetId or category in dataset');
      }
    }

    // Handle save name button click in modal
    const saveBtn = target.closest('#save-asset-name') as HTMLElement | null;
    if (saveBtn) {
      const cat = saveBtn.dataset.category;
      const idStr = saveBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetName(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save button');
      }
    }

    // Handle save description button click in modal
    const saveDescBtn = target.closest('#save-asset-description') as HTMLElement | null;
    if (saveDescBtn) {
      const cat = saveDescBtn.dataset.category;
      const idStr = saveDescBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetDescription(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save description button');
      }
    }

    // Handle save basic info (name + description) button click in modal
    const saveBasicBtn = target.closest('#save-basic-info') as HTMLElement | null;
    if (saveBasicBtn) {
      const cat = saveBasicBtn.dataset.category;
      const idStr = saveBasicBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetBasicInfo(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save basic info button');
      }
    }

    // Handle custom number spinner buttons (up/down) in modal
    const spinnerUp = target.closest('.spinner-up') as HTMLElement | null;
    if (spinnerUp) {
      e.preventDefault();
      const inputId = spinnerUp.dataset.inputId;
      if (inputId) {
        const input = document.getElementById(inputId) as HTMLInputElement | null;
        if (input) {
          const step = input.step && input.step !== 'any' ? parseFloat(input.step) : 1;
          const max = input.max !== '' ? parseFloat(input.max) : Infinity;
          const current = input.value !== '' ? parseFloat(input.value) : 0;
          const next = Math.min(current + step, max);
          input.value = String(next);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    const spinnerDown = target.closest('.spinner-down') as HTMLElement | null;
    if (spinnerDown) {
      e.preventDefault();
      const inputId = spinnerDown.dataset.inputId;
      if (inputId) {
        const input = document.getElementById(inputId) as HTMLInputElement | null;
        if (input) {
          const step = input.step && input.step !== 'any' ? parseFloat(input.step) : 1;
          const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
          const current = input.value !== '' ? parseFloat(input.value) : 0;
          const next = Math.max(current - step, min);
          input.value = String(next);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    // Handle save light button click in modal
    const saveLightBtn = target.closest('#save-light') as HTMLElement | null;
    if (saveLightBtn) {
      const cat = saveLightBtn.dataset.category;
      const idStr = saveLightBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetLight(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save light button');
      }
    }

    // Handle save shift button click in modal
    const saveShiftBtn = target.closest('#save-shift') as HTMLElement | null;
    if (saveShiftBtn) {
      const cat = saveShiftBtn.dataset.category;
      const idStr = saveShiftBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetShift(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save shift button');
      }
    }

    // Handle save height button click in modal
    const saveHeightBtn = target.closest('#save-height') as HTMLElement | null;
    if (saveHeightBtn) {
      const cat = saveHeightBtn.dataset.category;
      const idStr = saveHeightBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetHeight(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save height button');
      }
    }

    // Handle save write button click in modal
    const saveWriteBtn = target.closest('#save-write') as HTMLElement | null;
    if (saveWriteBtn) {
      const cat = saveWriteBtn.dataset.category;
      const idStr = saveWriteBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetWrite(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save write button');
      }
    }

    // Handle save write once button click in modal
    const saveWriteOnceBtn = target.closest('#save-write-once') as HTMLElement | null;
    if (saveWriteOnceBtn) {
      const cat = saveWriteOnceBtn.dataset.category;
      const idStr = saveWriteOnceBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetWriteOnce(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save write once button');
      }
    }

    // Handle save automap button click in modal
    const saveAutomapBtn = target.closest('#save-automap') as HTMLElement | null;
    if (saveAutomapBtn) {
      const cat = saveAutomapBtn.dataset.category;
      const idStr = saveAutomapBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetAutomap(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save automap button');
      }
    }

    // Handle save hook button click in modal
    const saveHookBtn = target.closest('#save-hook') as HTMLElement | null;
    if (saveHookBtn) {
      const cat = saveHookBtn.dataset.category;
      const idStr = saveHookBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetHook(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save hook button');
      }
    }

    // Handle save lenshelp button click in modal
    const saveLenshelpBtn = target.closest('#save-lenshelp') as HTMLElement | null;
    if (saveLenshelpBtn) {
      const cat = saveLenshelpBtn.dataset.category;
      const idStr = saveLenshelpBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetLenshelp(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save lenshelp button');
      }
    }

    // Handle save clothes button click in modal
    const saveClothesBtn = target.closest('#save-clothes') as HTMLElement | null;
    if (saveClothesBtn) {
      const cat = saveClothesBtn.dataset.category;
      const idStr = saveClothesBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetClothes(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save clothes button');
      }
    }

    // Handle save default action button click in modal
    const saveDefaultActionBtn = target.closest('#save-default-action') as HTMLElement | null;
    if (saveDefaultActionBtn) {
      const cat = saveDefaultActionBtn.dataset.category;
      const idStr = saveDefaultActionBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetDefaultAction(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save default action button');
      }
    }

    // Handle save market button click in modal
    const saveMarketBtn = target.closest('#save-market') as HTMLElement | null;
    if (saveMarketBtn) {
      const cat = saveMarketBtn.dataset.category;
      const idStr = saveMarketBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetMarket(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save market button');
      }
    }

    // Handle save bank button click in modal
    const saveBankBtn = target.closest('#save-bank') as HTMLElement | null;
    if (saveBankBtn) {
      const cat = saveBankBtn.dataset.category;
      const idStr = saveBankBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetBank(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save bank button');
      }
    }

    // Handle save changed-to-expire button click in modal
    const saveChangedToExpireBtn = target.closest('#save-changed-to-expire') as HTMLElement | null;
    if (saveChangedToExpireBtn) {
      const cat = saveChangedToExpireBtn.dataset.category;
      const idStr = saveChangedToExpireBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetChangedToExpire(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save changed-to-expire button');
      }
    }

    // Handle save cyclopedia item button click in modal
    const saveCyclopediaItemBtn = target.closest('#save-cyclopedia-item') as HTMLElement | null;
    if (saveCyclopediaItemBtn) {
      const cat = saveCyclopediaItemBtn.dataset.category;
      const idStr = saveCyclopediaItemBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetCyclopediaItem(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save cyclopedia item button');
      }
    }

    // Handle save upgrade classification button click in modal
    const saveUpgradeClassificationBtn = target.closest('#save-upgrade-classification') as HTMLElement | null;
    if (saveUpgradeClassificationBtn) {
      const cat = saveUpgradeClassificationBtn.dataset.category;
      const idStr = saveUpgradeClassificationBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetUpgradeClassification(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save upgrade classification button');
      }
    }

    // Handle save skillwheel gem button click in modal
    const saveSkillwheelGemBtn = target.closest('#save-skillwheel-gem') as HTMLElement | null;
    if (saveSkillwheelGemBtn) {
      const cat = saveSkillwheelGemBtn.dataset.category;
      const idStr = saveSkillwheelGemBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetSkillwheelGem(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save skillwheel gem button');
      }
    }

    // Handle save imbueable button click in modal
    const saveImbueableBtn = target.closest('#save-imbueable') as HTMLElement | null;
    if (saveImbueableBtn) {
      const cat = saveImbueableBtn.dataset.category;
      const idStr = saveImbueableBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetImbueable(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save imbueable button');
      }
    }

    // Handle save proficiency button click in modal
    const saveProficiencyBtn = target.closest('#save-proficiency') as HTMLElement | null;
    if (saveProficiencyBtn) {
      const cat = saveProficiencyBtn.dataset.category;
      const idStr = saveProficiencyBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetProficiency(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save proficiency button');
      }
    }

    // Handle save transparency level button click in modal
    const saveTransparencyLevelBtn = target.closest('#save-transparency-level') as HTMLElement | null;
    if (saveTransparencyLevelBtn) {
      const cat = saveTransparencyLevelBtn.dataset.category;
      const idStr = saveTransparencyLevelBtn.dataset.id;
      if (cat && idStr) {
        (window as any).saveAssetTransparencyLevel(cat, parseInt(idStr, 10));
      } else {
        console.error('Missing data attributes on save transparency level button');
      }
    }

    // Handle flag checkbox toggle
    const flagCheckbox = target.closest('.flag-checkbox') as HTMLInputElement | null;
    if (flagCheckbox) {
      const cat = flagCheckbox.dataset.category;
      const idStr = flagCheckbox.dataset.id;
      const flagKey = flagCheckbox.dataset.flag;
      const checked = (flagCheckbox as HTMLInputElement).checked;
      if (cat && idStr && flagKey) {
        try {
          await invoke('update_appearance_flag_bool', { category: cat, id: parseInt(idStr, 10), flag: flagKey, value: checked });
          await invoke('save_appearances_file');
          await refreshAssetDetails(cat, parseInt(idStr, 10));
        } catch (err) {
          console.error('Failed to update flag', flagKey, err);
          alert('Falha ao atualizar flag: ' + flagKey);
        }
      } else {
        console.error('Missing data attributes on flag checkbox');
      }
    }

    // Handle modal tab switching
    const tabClick = target.closest('.tab-btn') as HTMLElement | null;
    if (tabClick) {
      const tab = tabClick.dataset.tab;
      const editContainer = document.getElementById('edit-content');
      const detailsContainer = document.getElementById('details-content');
      const tabEdit = document.getElementById('tab-edit');
      const tabDetails = document.getElementById('tab-details');
      if (tab === 'edit') {
        if (editContainer && detailsContainer) {
          editContainer.style.display = 'block';
          detailsContainer.style.display = 'none';
        }
        tabEdit?.classList.add('active');
        tabDetails?.classList.remove('active');
      } else if (tab === 'details') {
        if (editContainer && detailsContainer) {
          editContainer.style.display = 'none';
          detailsContainer.style.display = 'block';
        }
        tabDetails?.classList.add('active');
        tabEdit?.classList.remove('active');
      }
    }

    // Handle back button clicks
    if (target.closest('.modern-back-btn') || target.closest('#back-btn')) {
      goBack();
    }
  });
}

function openCategoryWithSubcategory(category: string, subcategory: string) {
  currentCategory = category;
  currentSubcategory = subcategory;
  currentView = 'category';
  currentPage = 0;
  currentSearch = "";

  // Hide main navigation, header and show category view
  const appHeader = document.querySelector('.app-header') as HTMLElement;
  const categoryNav = document.querySelector('.category-nav') as HTMLElement;
  const categoryView = document.querySelector('#category-view') as HTMLElement;

  if (appHeader) appHeader.style.display = 'none';
  if (categoryNav) categoryNav.style.display = 'none';
  if (categoryView) categoryView.style.display = 'block';

  // Update view header
  updateCategoryHeader(category);

  // Render subcategory options
  renderSubcategoryOptions(category);

  // Set the selected subcategory in the dropdown
  const subcategorySelect = document.getElementById('subcategory-select') as HTMLSelectElement;
  if (subcategorySelect) {
    subcategorySelect.value = subcategory;
  }

  // Load assets for the category with subcategory filter
  loadAssets();
}

async function openCategory(category: string) {
  currentCategory = category;
  currentView = 'category';
  currentPage = 0;
  currentSearch = "";
  currentSubcategory = 'All';

  // Hide main navigation, header and show category view
  const appHeader = document.querySelector('.app-header') as HTMLElement;
  const categoryNav = document.querySelector('.category-nav') as HTMLElement;
  const categoryView = document.querySelector('#category-view') as HTMLElement;

  if (appHeader) appHeader.style.display = 'none';
  if (categoryNav) categoryNav.style.display = 'none';
  if (categoryView) categoryView.style.display = 'block';

  // Update view header
  updateCategoryHeader(category);

  // Render subcategory options
  renderSubcategoryOptions(category);

  // Load assets for the category
  loadAssets();
}

function goBack() {
  if (currentView === 'category') {
    currentView = 'main';
    currentCategory = "Objects";
    
    // Hide category view and show main navigation and header
    const categoryView = document.querySelector('#category-view') as HTMLElement;
    const appHeader = document.querySelector('.app-header') as HTMLElement;
    const categoryNav = document.querySelector('.category-nav') as HTMLElement;
    
    if (categoryView) categoryView.style.display = 'none';
    if (appHeader) appHeader.style.display = 'block';
    if (categoryNav) categoryNav.style.display = 'block';
  }
}

function updateCategoryHeader(category: string) {
  const categoryInfo = getCategoryInfo(category);
  
  const viewIcon = document.querySelector('.view-icon') as HTMLElement;
  const viewTitle = document.querySelector('.view-info h2') as HTMLElement;
  const viewSubtitle = document.querySelector('.view-subtitle') as HTMLElement;
  
  if (viewIcon) viewIcon.textContent = categoryInfo.icon;
  if (viewTitle) viewTitle.textContent = categoryInfo.title;
  if (viewSubtitle) viewSubtitle.textContent = categoryInfo.description;
}

function getCategoryInfo(category: string) {
  const categories: Record<string, {icon: string, title: string, description: string}> = {
    'Objects': {
      icon: '🎯',
      title: 'Objects',
      description: 'Items, decorações e objetos do jogo'
    },
    'Outfits': {
      icon: '👤',
      title: 'Outfits',
      description: 'Roupas e aparências de personagens'
    },
    'Effects': {
      icon: '✨',
      title: 'Effects',
      description: 'Efeitos visuais e animações'
    },
    'Missiles': {
      icon: '🏹',
      title: 'Missiles',
      description: 'Projéteis e mísseis'
    }
  };

  return categories[category] || { icon: '📦', title: 'Unknown', description: 'Categoria desconhecida' };
}

function renderSubcategoryOptions(category: string) {
  const subcategorySelect = document.getElementById('subcategory-select') as HTMLSelectElement;
  if (!subcategorySelect) return;

  // Clear existing options
  subcategorySelect.innerHTML = '';

  if (category === 'Objects') {
    // Carrega subcategorias do backend para manter nomes consistentes
    invoke<[string, string][]>("get_item_subcategories")
      .then((subcategories) => {
        subcategories.forEach(([value, label]) => {
          const option = document.createElement('option');
          option.value = value; // e.g. "Armors", "Amulets", ...
          option.textContent = label; // nome exibido
          subcategorySelect.appendChild(option);
        });
        // Mantém a seleção atual se possível
        if (currentSubcategory) {
          subcategorySelect.value = currentSubcategory;
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar subcategorias:', err);
        // Fallback mínimo
        const option = document.createElement('option');
        option.value = 'All';
        option.textContent = 'Todas as subcategorias';
        subcategorySelect.appendChild(option);
      });
  } else {
    const option = document.createElement('option');
    option.value = 'All';
    option.textContent = 'Todas as subcategorias';
    subcategorySelect.appendChild(option);
  }
}

function updateHeaderStats() {
  // Update category counts in the navigation cards
  const objectsCount = document.getElementById('objects-count');
  const outfitsCount = document.getElementById('outfits-count');
  const effectsCount = document.getElementById('effects-count');
  const missilesCount = document.getElementById('missiles-count');
  
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
}

function switchCategory(category: string) {
  currentCategory = category;
  currentPage = 0;
  currentSearch = "";
  currentSubcategory = "All";

  if (assetSearch) {
    assetSearch.value = "";
  }

  // Update active tab
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  document.querySelector(`[data-category="${category}"]`)?.classList.add("active");

  // Show/hide subcategory selector based on category
  const subcategoryContainer = document.getElementById("subcategory-container");
  if (subcategoryContainer) {
    if (category === "Objects") {
      subcategoryContainer.style.display = "flex";
      loadSubcategories();
    } else {
      subcategoryContainer.style.display = "none";
    }
  }

  loadAssets();
}

async function loadSubcategories() {
  try {
    const subcategories = await invoke("get_item_subcategories") as [string, string][];
    const subcategorySelect = document.getElementById("subcategory-select") as HTMLSelectElement;
    
    if (subcategorySelect) {
      // Clear existing options
      subcategorySelect.innerHTML = "";
      
      // Add subcategory options
      subcategories.forEach(([value, displayName]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = displayName;
        subcategorySelect.appendChild(option);
      });
      
      // Set current subcategory
      subcategorySelect.value = currentSubcategory;
    }
  } catch (error) {
    console.error("Error loading subcategories:", error);
  }
}

function switchSubcategory(subcategory: string) {
  currentSubcategory = subcategory;
  currentPage = 0;
  loadAssets();
}

async function loadAssets() {
  if (!assetsGrid) return;

  try {
    showLoadingState();

    // Get total count
    const totalCount = await invoke("get_appearance_count", {
      category: currentCategory,
      search: currentSearch || null,
      subcategory: currentCategory === "Objects" && currentSubcategory !== "All" ? currentSubcategory : null
    });
    totalItems = totalCount as number;

    // Load assets for current page
    const assets = await invoke("list_appearances_by_category", {
      category: currentCategory,
      page: currentPage,
      pageSize: currentPageSize,
      search: currentSearch || null,
      subcategory: currentCategory === "Objects" && currentSubcategory !== "All" ? currentSubcategory : null
    });

    displayAssets(assets as any[]);
    updatePaginationInfo();
  } catch (error) {
    console.error("Error loading assets:", error);
    showErrorState(error as string);
  }
}

function showLoadingState() {
  // Stop any active animations before reloading grid
  stopAllAnimationPlayers();
  if (assetsGrid) {
    assetsGrid.innerHTML = `
      <div class="loading-spinner">
        <div>🔄 Loading assets...</div>
      </div>
    `;
  }
}

function showErrorState(error: string) {
  if (assetsGrid) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>❌ Error Loading Assets</h3>
        <p>${error}</p>
      </div>
    `;
  }
}

async function displayAssets(assets: any[]) {
  if (!assetsGrid) return;

  if (assets.length === 0) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>📭 No Assets Found</h3>
        <p>No assets match your current search criteria.</p>
      </div>
    `;
    return;
  }

  // Create asset items with placeholders first
  assetsGrid.innerHTML = assets.map(asset => `
    <div class="asset-item" data-asset-id="${asset.id}" data-category="${currentCategory}">
      <div class="asset-item-header">
        <span class="asset-id">#${asset.id}</span>
        <div class="asset-flags">
          ${asset.has_flags ? '<div class="flag-indicator" title="Has flags"></div>' : ''}
        </div>
      </div>
      <div class="asset-image-container" id="sprite-${asset.id}">
        <div class="sprite-loading">🔄</div>
      </div>
      <div class="asset-name">${asset.name || 'Unnamed'}</div>
      <div class="asset-description">${asset.description || 'No description'}</div>
      <div class="asset-meta">
        <span>Sprites: ${asset.sprite_count}</span>
        <span>${currentCategory.slice(0, -1)}</span>
      </div>
    </div>
  `).join('');

  // Load sprites asynchronously
  loadSpritesForAssets(assets);
}

async function loadSpritesForAssets(assets: any[]) {
  for (const asset of assets) {
    try {
      const sprites = await getAppearanceSprites(currentCategory, asset.id);
      const container = document.getElementById(`sprite-${asset.id}`);
      
      if (container) {
        if (sprites.length > 0) {
          // Show first sprite
          const img = createSpriteImage(sprites[0]);
          container.innerHTML = '';
          container.appendChild(img);
          // Auto-animate on main grid if flag is active
          initAssetCardAutoAnimation(currentCategory, asset.id, sprites);
        } else {
          // Show placeholder
          const placeholder = createPlaceholderImage();
          container.innerHTML = '';
          container.appendChild(placeholder);
        }
      }
    } catch (error) {
      console.warn(`Failed to load sprite for asset ${asset.id}:`, error);
      const container = document.getElementById(`sprite-${asset.id}`);
      if (container) {
        const placeholder = createPlaceholderImage();
        container.innerHTML = '';
        container.appendChild(placeholder);
      }
    }
  }
}

function updatePaginationInfo() {
  const totalPages = Math.ceil(totalItems / currentPageSize);
  
  if (itemsCount) {
    itemsCount.textContent = `${totalItems} itens`;
  }
  
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
  }
  
  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage === 0;
  }
  
  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage >= totalPages - 1;
  }
}

function changePage(newPage: number) {
  const totalPages = Math.ceil(totalItems / currentPageSize);
  if (newPage >= 0 && newPage < totalPages) {
    currentPage = newPage;
    loadAssets();
  }
}

function performSearch() {
  if (assetSearch) {
    currentSearch = assetSearch.value.trim();
    currentPage = 0;
    loadAssets();
  }
}

function clearSearch() {
  if (assetSearch) {
    assetSearch.value = "";
    currentSearch = "";
    currentPage = 0;
    loadAssets();
  }
}

async function showAssetDetails(category: string, id: number) {
  console.log(`showAssetDetails called with category: ${category}, id: ${id}`);

  if (!assetDetails || !detailsContent) {
    console.error("assetDetails or detailsContent is null");
    return;
  }

  try {
    console.log("Invoking get_complete_appearance...");
    // Use the new complete appearance command
    const completeData = await invoke("get_complete_appearance", {
      category,
      id
    }) as CompleteAppearanceItem;

    console.log("Received complete data:", completeData);
    // Save details for card animations
    currentAppearanceDetails = completeData;
    await displayCompleteAssetDetails(completeData, category);

    // Force display the modal
    assetDetails.style.display = "flex";
    assetDetails.classList.add("show");
    console.log("Modal display:", window.getComputedStyle(assetDetails).display);
    console.log("Modal should now be visible");

    // Initialize animation players per frame group
    initAnimationPlayersForDetails(completeData, category);

    // Load sprites for this specific item
    loadDetailSprites(category, id);
  } catch (error) {
    console.error("Error loading asset details:", error);
  }
}

async function loadDetailSprites(category: string, id: number) {
  try {
    // Clear cache for this specific item to get fresh sprites
    const cacheKey = getSpritesCacheKey(category, id);
    spriteCache.delete(cacheKey);

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
        initDetailSpriteCardAnimations(id, sprites);
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

async function displayCompleteAssetDetails(details: CompleteAppearanceItem, category: string) {
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
    { name: 'Don\'t Hide', value: flags.dont_hide },
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

  detailsContent.innerHTML = `
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

    <div class="detail-section">
      <h4>Sprite Preview</h4>
      <div class="detail-sprites" id="detail-sprites-${details.id}">
        <div class="sprite-loading">🔄 Loading sprites...</div>
      </div>
    </div>

    ${details.frame_groups.length > 0 ? `
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
              ${spriteInfo ? `
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
                ${spriteInfo.sprite_ids.length > 0 ? `
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
                ${spriteInfo.bounding_square ? `
                  <div class="detail-item">
                    <span class="detail-label">Bounding Square:</span>
                    <span class="detail-value">${spriteInfo.bounding_square}</span>
                  </div>
                ` : ''}
                ${spriteInfo.is_opaque !== undefined ? `
                  <div class="detail-item">
                    <span class="detail-label">Is Opaque:</span>
                    <span class="detail-value">${spriteInfo.is_opaque ? '✅' : '❌'}</span>
                  </div>
                ` : ''}
                ${spriteInfo.animation ? `
                  <div class="detail-item-full animation-section">
                    <div class="detail-label">Animation Details:</div>
                    <div class="detail-value">
                      <div>Phases: ${spriteInfo.animation.phases.length}</div>
                      ${spriteInfo.animation.synchronized !== undefined ? `<div>Synchronized: ${spriteInfo.animation.synchronized ? 'Yes' : 'No'}</div>` : ''}
                      ${spriteInfo.animation.loop_type !== undefined ? `<div>Loop Type: ${(function(){const lt=spriteInfo.animation.loop_type;return lt===-1?'Pingpong':lt===0?'Infinito':lt===1?'Contado':`Desconhecido (${lt})`;})()}</div>` : ''}
                      ${spriteInfo.animation.loop_count !== undefined ? `<div>Loop Count: ${spriteInfo.animation.loop_count}</div>` : ''}
                      <div class="animation-phases">
                        ${spriteInfo.animation.phases.map((ph, idx) => `
                          <div class="phase-item">
                            <span class="phase-index">Phase #${idx + 1}</span>
                            <span class="phase-duration">${ph.duration_min ?? '—'}-${ph.duration_max ?? '—'} ms</span>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                ` : ''}
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}

    ${basicFlags.length > 0 ? `
      <div class="detail-section">
        <h4>Active Flags (${basicFlags.length})</h4>
        <div class="flags-grid">
          ${basicFlags.map(flag => `
            <span class="flag-badge">✅ ${flag.name}</span>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${flags?.market ? `
      <div class="detail-section">
        <h4>Market Information</h4>
        ${flags.market.category !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Category:</span>
            <span class="detail-value">${flags.market.category}</span>
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
        ${flags.market.restrict_to_vocation.length > 0 ? `
          <div class="detail-item">
            <span class="detail-label">Restricted Vocations:</span>
            <span class="detail-value">${flags.market.restrict_to_vocation.join(', ')}</span>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${flags?.npc_sale_data && flags.npc_sale_data.length > 0 ? `
      <div class="detail-section">
        <h4>NPC Sale Data (${flags.npc_sale_data.length})</h4>
        ${flags.npc_sale_data.map(npc => `
          <div class="npc-data-item">
            ${npc.name ? `<strong>${npc.name}</strong>` : ''}
            ${npc.location ? ` - ${npc.location}` : ''}
            <div class="detail-item">
              ${npc.sale_price !== undefined ? `
                <span class="detail-label">Sell Price:</span>
                <span class="detail-value">${npc.sale_price} gp</span>
              ` : ''}
            </div>
            <div class="detail-item">
              ${npc.buy_price !== undefined ? `
                <span class="detail-label">Buy Price:</span>
                <span class="detail-value">${npc.buy_price} gp</span>
              ` : ''}
            </div>
            ${npc.currency_object_type_id !== undefined ? `
              <div class="detail-item">
                <span class="detail-label">Currency Object ID:</span>
                <span class="detail-value">${npc.currency_object_type_id}</span>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${flags?.light ? `
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
    ` : ''}

    ${flags?.shift ? `
      <div class="detail-section">
        <h4>Shift Properties</h4>
        <div class="detail-item">
          <span class="detail-label">Offset:</span>
          <span class="detail-value">X: ${flags.shift.x || 0}, Y: ${flags.shift.y || 0}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.height ? `
      <div class="detail-section">
        <h4>Height Properties</h4>
        <div class="detail-item">
          <span class="detail-label">Elevation:</span>
          <span class="detail-value">${flags.height.elevation}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.automap ? `
      <div class="detail-section">
        <h4>Automap</h4>
        <div class="detail-item">
          <span class="detail-label">Color:</span>
          <span class="detail-value">${flags.automap.color}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.clothes ? `
      <div class="detail-section">
        <h4>Clothes</h4>
        <div class="detail-item">
          <span class="detail-label">Slot:</span>
          <span class="detail-value">${(function(){const s=flags.clothes.slot;const names=['Nenhum','Capacete','Amuleto','Mochila','Armadura','Escudo','Arma','Pernas','Botas','Anel','Flecha'];return s==null?'—':(names[s]??`Desconhecido (${s})`);})()}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.write ? `
      <div class="detail-section">
        <h4>Writable</h4>
        <div class="detail-item">
          <span class="detail-label">Max Text Length:</span>
          <span class="detail-value">${flags.write.max_text_length}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.write_once ? `
      <div class="detail-section">
        <h4>Write Once</h4>
        <div class="detail-item">
          <span class="detail-label">Max Text Length:</span>
          <span class="detail-value">${flags.write_once.max_text_length_once}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.hook ? `
      <div class="detail-section">
        <h4>Hook</h4>
        <div class="detail-item">
          <span class="detail-label">Direction:</span>
          <span class="detail-value">${(function(){const d=flags.hook.direction;return d===1?'Sul':d===2?'Leste':`Desconhecido (${d})`;})()}</span>
        </div>
        ${flags.hook_south !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Hook South:</span>
            <span class="detail-value">${flags.hook_south ? 'Yes' : 'No'}</span>
          </div>
        ` : ''}
        ${flags.hook_east !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Hook East:</span>
            <span class="detail-value">${flags.hook_east ? 'Yes' : 'No'}</span>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${flags?.default_action ? `
      <div class="detail-section">
        <h4>Default Action</h4>
        <div class="detail-item">
          <span class="detail-label">Action:</span>
          <span class="detail-value">${flags.default_action.action}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.lenshelp ? `
      <div class="detail-section">
        <h4>Lens Help</h4>
        <div class="detail-item">
          <span class="detail-label">ID:</span>
          <span class="detail-value">${flags.lenshelp.id}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.bank ? `
      <div class="detail-section">
        <h4>Bank</h4>
        <div class="detail-item">
          <span class="detail-label">Waypoints:</span>
          <span class="detail-value">${flags.bank.waypoints}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.cyclopedia_item ? `
      <div class="detail-section">
        <h4>Cyclopedia</h4>
        <div class="detail-item">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${flags.cyclopedia_item.cyclopedia_type}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.upgrade_classification ? `
      <div class="detail-section">
        <h4>Upgrade Classification</h4>
        <div class="detail-item">
          <span class="detail-label">Classification:</span>
          <span class="detail-value">${flags.upgrade_classification.upgrade_classification}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.skillwheel_gem ? `
      <div class="detail-section">
        <h4>Skill Wheel Gem</h4>
        ${flags.skillwheel_gem.gem_quality_id !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Gem Quality ID:</span>
            <span class="detail-value">${flags.skillwheel_gem.gem_quality_id}</span>
          </div>
        ` : ''}
        ${flags.skillwheel_gem.vocation_id !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Vocation ID:</span>
            <span class="detail-value">${flags.skillwheel_gem.vocation_id}</span>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${flags?.imbueable ? `
      <div class="detail-section">
        <h4>Imbueable</h4>
        <div class="detail-item">
          <span class="detail-label">Slots:</span>
          <span class="detail-value">${flags.imbueable.slot_count}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.proficiency ? `
      <div class="detail-section">
        <h4>Proficiency</h4>
        <div class="detail-item">
          <span class="detail-label">ID:</span>
          <span class="detail-value">${flags.proficiency.proficiency_id}</span>
        </div>
      </div>
    ` : ''}

    ${typeof flags?.transparency_level === 'number' ? `
      <div class="detail-section">
        <h4>Transparency</h4>
        <div class="detail-item">
          <span class="detail-label">Level:</span>
          <span class="detail-value">${flags.transparency_level}</span>
        </div>
      </div>
    ` : ''}

    ${flags?.changed_to_expire ? `
      <div class="detail-section">
        <h4>Changed To Expire</h4>
        <div class="detail-item">
          <span class="detail-label">Former Object Type ID:</span>
          <span class="detail-value">${flags.changed_to_expire.former_object_typeid}</span>
        </div>
      </div>
    ` : ''}
  `;

  const editContent = document.getElementById('edit-content');
  if (editContent) {
    // Definições de flags booleanas editáveis
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

    editContent.innerHTML = `
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
          <div class="number-input">
            <input type="number" id="hook-direction" value="${flags?.hook?.direction ?? ''}" placeholder="ex: 1=Sul, 2=Leste" />
            <div class="spinner-controls">
              <button type="button" class="spinner-up" data-input-id="hook-direction"></button>
              <button type="button" class="spinner-down" data-input-id="hook-direction"></button>
            </div>
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
          <div class="number-input">
            <input type="number" id="default-action" value="${flags?.default_action?.action ?? ''}" placeholder="ex: 5" />
            <div class="spinner-controls">
              <button type="button" class="spinner-up" data-input-id="default-action"></button>
              <button type="button" class="spinner-down" data-input-id="default-action"></button>
            </div>
          </div>
        </div>
        <button id="save-default-action" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Default Action</button>
      </div>

      <div class="detail-section">
        <h4>Market</h4>
        <div class="detail-item">
          <span class="detail-label">Category:</span>
          <div class="number-input">
            <input type="number" id="market-category" value="${flags?.market?.category ?? ''}" placeholder="ex: 2" />
            <div class="spinner-controls">
              <button type="button" class="spinner-up" data-input-id="market-category"></button>
              <button type="button" class="spinner-down" data-input-id="market-category"></button>
            </div>
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
          <input type="text" id="market-restrict-to-vocation" value="${flags?.market?.restrict_to_vocation?.join(',') ?? ''}" placeholder="ex: 1,2,3" />
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
          <input type="text" id="market-vocation" value="" placeholder="ex: Knight" />
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
          <span class="detail-label">Vocation ID:</span>
          <div class="number-input">
            <input type="number" id="skillwheel-vocation-id" value="${flags?.skillwheel_gem?.vocation_id ?? ''}" placeholder="ex: 4" />
            <div class="spinner-controls">
              <button type="button" class="spinner-up" data-input-id="skillwheel-vocation-id"></button>
              <button type="button" class="spinner-down" data-input-id="skillwheel-vocation-id"></button>
            </div>
          </div>
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

}

function closeAssetDetails() {
  if (assetDetails) {
    // Stop only detail-related animation timers
    stopDetailAnimationPlayers();
    assetDetails.classList.remove("show");
    assetDetails.style.display = "none";
  }
}

// Atualiza imediatamente os detalhes na modal após mudanças
async function refreshAssetDetails(category: string, id: number) {
  try {
    // Evita duplicar timers/animadores
    stopDetailAnimationPlayers();
    const updated = await invoke("get_complete_appearance", { category, id }) as CompleteAppearanceItem;
    currentAppearanceDetails = updated;
    await displayCompleteAssetDetails(updated, category);
    // Recria animadores e sprites conforme novo estado
    initAnimationPlayersForDetails(updated, category);
    loadDetailSprites(category, id);
  } catch (err) {
    console.error("Falha ao atualizar detalhes do item:", err);
  }
}

// Função global para salvar o nome do item
;(window as any).saveAssetName = async function (category: string, id: number) {
  try {
    const inputEl = document.getElementById('asset-name-input') as HTMLInputElement | null;
    if (!inputEl) return;
    const newName = inputEl.value?.trim() || '';
    if (!newName) {
      alert('O nome não pode ser vazio.');
      return;
    }

    // Atualiza no backend em memória
    await invoke('update_appearance_name', { category, id, newName: newName });

    // Salva o arquivo .dat atual
    await invoke('save_appearances_file');

    // Atualiza o texto na modal
    const nameValue = document.getElementById('detail-name-value');
    if (nameValue) nameValue.textContent = newName;

    // Atualiza o card no grid, se existir
    const sel = `.asset-item[data-asset-id="${id}"][data-category="${category}"] .asset-name`;
    const gridNameEl = document.querySelector(sel) as HTMLElement | null;
    if (gridNameEl) gridNameEl.textContent = newName;

    // Feedback simples
    const btn = document.getElementById('save-asset-name') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar nome do item:', err);
    alert('Falha ao salvar o nome. Veja o console para detalhes.');
  }
};

// Função global para salvar descrição
;(window as any).saveAssetDescription = async function (category: string, id: number) {
  try {
    const inputEl = document.getElementById('asset-description-input') as HTMLTextAreaElement | null;
    if (!inputEl) return;
    const newDescription = inputEl.value?.trim() || '';

    await invoke('update_appearance_description', { category, id, newDescription });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-asset-description') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Descrição';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar descrição:', err);
    alert('Falha ao salvar a descrição.');
  }
}

// Função global para salvar nome + descrição em um único passo
;(window as any).saveAssetBasicInfo = async function (category: string, id: number) {
  try {
    const inputName = document.getElementById('asset-name-input') as HTMLInputElement | null;
    const inputDesc = document.getElementById('asset-description-input') as HTMLTextAreaElement | null;
    if (!inputName || !inputDesc) return;

    const newName = inputName.value?.trim() || '';
    if (!newName) {
      alert('O nome não pode ser vazio.');
      return;
    }
    const newDescription = inputDesc.value?.trim() || '';

    await invoke('update_appearance_name', { category, id, newName });
    await invoke('update_appearance_description', { category, id, newDescription });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-basic-info') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar';
        btn.disabled = false;
      }, 1200);
    }

    // Atualiza UI imediatamente (nome visível em detalhes e grid)
    const nameValue = document.getElementById('detail-name-value');
    if (nameValue) nameValue.textContent = newName;
    const sel = `.asset-item[data-asset-id="${id}"][data-category="${category}"] .asset-name`;
    const gridNameEl = document.querySelector(sel) as HTMLElement | null;
    if (gridNameEl) gridNameEl.textContent = newName;

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar nome e descrição:', err);
    alert('Falha ao salvar nome/descrição.');
  }
}

// Light
;(window as any).saveAssetLight = async function (category: string, id: number) {
  try {
    const bEl = document.getElementById('light-brightness') as HTMLInputElement | null;
    const cEl = document.getElementById('light-color') as HTMLInputElement | null;
    const brightness = bEl && bEl.value !== '' ? parseInt(bEl.value, 10) : null;
    const color = cEl && cEl.value !== '' ? parseInt(cEl.value, 10) : null;

    await invoke('update_appearance_light', { category, id, brightness, color });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-light') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Light';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Light:', err);
    alert('Falha ao salvar Light.');
  }
}

// Shift
;(window as any).saveAssetShift = async function (category: string, id: number) {
  try {
    const xEl = document.getElementById('shift-x') as HTMLInputElement | null;
    const yEl = document.getElementById('shift-y') as HTMLInputElement | null;
    const x = xEl && xEl.value !== '' ? parseInt(xEl.value, 10) : null;
    const y = yEl && yEl.value !== '' ? parseInt(yEl.value, 10) : null;

    await invoke('update_appearance_shift', { category, id, x, y });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-shift') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Shift';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Shift:', err);
    alert('Falha ao salvar Shift.');
  }
}

// Height
;(window as any).saveAssetHeight = async function (category: string, id: number) {
  try {
    const eEl = document.getElementById('height-elevation') as HTMLInputElement | null;
    const elevation = eEl && eEl.value !== '' ? parseInt(eEl.value, 10) : null;

    await invoke('update_appearance_height', { category, id, elevation });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-height') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Height';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Height:', err);
    alert('Falha ao salvar Height.');
  }
}

// Write
;(window as any).saveAssetWrite = async function (category: string, id: number) {
  try {
    const wEl = document.getElementById('write-max-text-length') as HTMLInputElement | null;
    const maxTextLength = wEl && wEl.value !== '' ? parseInt(wEl.value, 10) : null;

    await invoke('update_appearance_write', { category, id, maxTextLength });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-write') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Write';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Write:', err);
    alert('Falha ao salvar Write.');
  }
}

// Write Once
;(window as any).saveAssetWriteOnce = async function (category: string, id: number) {
  try {
    const wEl = document.getElementById('write-once-max-text-length') as HTMLInputElement | null;
    const maxTextLengthOnce = wEl && wEl.value !== '' ? parseInt(wEl.value, 10) : null;

    await invoke('update_appearance_write_once', { category, id, maxTextLengthOnce });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-write-once') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Write Once';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Write Once:', err);
    alert('Falha ao salvar Write Once.');
  }
}

;(window as any).saveAssetAutomap = async function (category: string, id: number) {
  try {
    const el = document.getElementById('automap-color') as HTMLInputElement | null;
    const color = el && el.value !== '' ? parseInt(el.value, 10) : null;

    await invoke('update_appearance_automap', { category, id, color });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-automap') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Automap';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Automap:', err);
    alert('Falha ao salvar Automap.');
  }
}

;(window as any).saveAssetHook = async function (category: string, id: number) {
  try {
    const el = document.getElementById('hook-direction') as HTMLInputElement | null;
    const direction = el && el.value !== '' ? parseInt(el.value, 10) : null;

    await invoke('update_appearance_hook', { category, id, direction });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-hook') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Hook';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Hook:', err);
    alert('Falha ao salvar Hook.');
  }
}

;(window as any).saveAssetLenshelp = async function (category: string, id: number) {
  try {
    const el = document.getElementById('lenshelp-id') as HTMLInputElement | null;
    const lenshelpId = el && el.value !== '' ? parseInt(el.value, 10) : null;

    await invoke('update_appearance_lenshelp', { category, id, lenshelpId });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-lenshelp') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Lens Help';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Lens Help:', err);
    alert('Falha ao salvar Lens Help.');
  }
}

;(window as any).saveAssetClothes = async function (category: string, id: number) {
  try {
    const el = document.getElementById('clothes-slot') as HTMLInputElement | null;
    const slot = el && el.value !== '' ? parseInt(el.value, 10) : null;

    await invoke('update_appearance_clothes', { category, id, slot });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-clothes') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Clothes';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Clothes:', err);
    alert('Falha ao salvar Clothes.');
  }
}

;(window as any).saveAssetDefaultAction = async function (category: string, id: number) {
  try {
    const el = document.getElementById('default-action') as HTMLInputElement | null;
    const action = el && el.value !== '' ? parseInt(el.value, 10) : null;

    await invoke('update_appearance_default_action', { category, id, action });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-default-action') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Default Action';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Default Action:', err);
    alert('Falha ao salvar Default Action.');
  }
}

;(window as any).saveAssetMarket = async function (category: string, id: number) {
  try {
    const catEl = document.getElementById('market-category') as HTMLInputElement | null;
    const tradeEl = document.getElementById('market-trade-as-object-id') as HTMLInputElement | null;
    const showEl = document.getElementById('market-show-as-object-id') as HTMLInputElement | null;
    const restEl = document.getElementById('market-restrict-to-vocation') as HTMLInputElement | null;
    const minLvlEl = document.getElementById('market-minimum-level') as HTMLInputElement | null;
    const nameEl = document.getElementById('market-name') as HTMLInputElement | null;
    const vocEl = document.getElementById('market-vocation') as HTMLInputElement | null;

    const categoryValue = catEl && catEl.value !== '' ? parseInt(catEl.value, 10) : null;
    const tradeAsObjectId = tradeEl && tradeEl.value !== '' ? parseInt(tradeEl.value, 10) : null;
    const showAsObjectId = showEl && showEl.value !== '' ? parseInt(showEl.value, 10) : null;
    const minimumLevel = minLvlEl && minLvlEl.value !== '' ? parseInt(minLvlEl.value, 10) : null;

    const restrictStr = restEl?.value?.trim() || '';
    const restrictToVocation = restrictStr
      ? restrictStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n))
      : [];

    const name = nameEl && nameEl.value !== '' ? nameEl.value : null;
    const vocation = vocEl && vocEl.value !== '' ? vocEl.value : null;

    await invoke('update_appearance_market', {
      category,
      id,
      categoryValue,
      tradeAsObjectId,
      showAsObjectId,
      restrictToVocation,
      minimumLevel,
      name,
      vocation,
    });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-market') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Market';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Market:', err);
    alert('Falha ao salvar Market.');
  }
}

;(window as any).saveAssetBank = async function (category: string, id: number) {
  try {
    const el = document.getElementById('bank-waypoints') as HTMLInputElement | null;
    const waypoints = el && el.value !== '' ? parseInt(el.value, 10) : null;

    await invoke('update_appearance_bank', { category, id, waypoints });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-bank') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Bank';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Bank:', err);
    alert('Falha ao salvar Bank.');
  }
}

;(window as any).saveAssetChangedToExpire = async function (category: string, id: number) {
  try {
    const el = document.getElementById('changed-to-expire-former-id') as HTMLInputElement | null;
    const formerObjectTypeid = el && el.value !== '' ? parseInt(el.value, 10) : null;

    await invoke('update_appearance_changed_to_expire', { category, id, formerObjectTypeid });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-changed-to-expire') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Changed To Expire';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Changed To Expire:', err);
    alert('Falha ao salvar Changed To Expire.');
  }
}

;(window as any).saveAssetCyclopediaItem = async function (category: string, id: number) {
  try {
    const el = document.getElementById('cyclopedia-type') as HTMLInputElement | null;
    const cyclopediaType = el && el.value !== '' ? parseInt(el.value, 10) : null;

    await invoke('update_appearance_cyclopedia_item', { category, id, cyclopediaType });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-cyclopedia-item') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Cyclopedia Item';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Cyclopedia Item:', err);
    alert('Falha ao salvar Cyclopedia Item.');
  }
}

;(window as any).saveAssetUpgradeClassification = async function (category: string, id: number) {
  try {
    const el = document.getElementById('upgrade-classification') as HTMLInputElement | null;
    const upgradeClassification = el && el.value !== '' ? parseInt(el.value, 10) : null;

    await invoke('update_appearance_upgrade_classification', { category, id, upgradeClassification });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-upgrade-classification') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Upgrade Classification';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Upgrade Classification:', err);
    alert('Falha ao salvar Upgrade Classification.');
  }
}

;(window as any).saveAssetSkillwheelGem = async function (category: string, id: number) {
  try {
    const qEl = document.getElementById('skillwheel-gem-quality-id') as HTMLInputElement | null;
    const vEl = document.getElementById('skillwheel-vocation-id') as HTMLInputElement | null;

    const gemQualityId = qEl && qEl.value !== '' ? parseInt(qEl.value, 10) : null;
    const vocationId = vEl && vEl.value !== '' ? parseInt(vEl.value, 10) : null;

    await invoke('update_appearance_skillwheel_gem', { category, id, gemQualityId, vocationId });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-skillwheel-gem') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Skill Wheel Gem';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Skill Wheel Gem:', err);
    alert('Falha ao salvar Skill Wheel Gem.');
  }
}

;(window as any).saveAssetImbueable = async function (category: string, id: number) {
  try {
    const el = document.getElementById('imbueable-slot-count') as HTMLInputElement | null;
    const slotCount = el && el.value !== '' ? parseInt(el.value, 10) : null;

    await invoke('update_appearance_imbueable', { category, id, slotCount });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-imbueable') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Imbueable';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Imbueable:', err);
    alert('Falha ao salvar Imbueable.');
  }
}

;(window as any).saveAssetProficiency = async function (category: string, id: number) {
  try {
    const el = document.getElementById('proficiency-id') as HTMLInputElement | null;
    const proficiencyId = el && el.value !== '' ? parseInt(el.value, 10) : null;

    await invoke('update_appearance_proficiency', { category, id, proficiencyId });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-proficiency') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Proficiency';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Proficiency:', err);
    alert('Falha ao salvar Proficiency.');
  }
}

;(window as any).saveAssetTransparencyLevel = async function (category: string, id: number) {
  try {
    const el = document.getElementById('transparency-level') as HTMLInputElement | null;
    const transparencyLevel = el && el.value !== '' ? parseInt(el.value, 10) : null;

    await invoke('update_appearance_transparency_level', { category, id, transparencyLevel });
    await invoke('save_appearances_file');

    const btn = document.getElementById('save-transparency-level') as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar Transparency Level';
        btn.disabled = false;
      }, 1200);
    }

    await refreshAssetDetails(category, id);
  } catch (err) {
    console.error('Erro ao salvar Transparency Level:', err);
    alert('Falha ao salvar Transparency Level.');
  }
}

const activeAnimationPlayers = new Map<string, number>();

function stopAllAnimationPlayers() {
  activeAnimationPlayers.forEach((timerId) => {
    if (timerId) clearInterval(timerId);
  });
  activeAnimationPlayers.clear();
}

// Stop only detail/modal animations, keep grid auto animations running
function stopDetailAnimationPlayers() {
  activeAnimationPlayers.forEach((timerId, key) => {
    if (key.startsWith('detail:') || key.startsWith('card:')) {
      if (timerId) clearInterval(timerId);
      activeAnimationPlayers.delete(key);
    }
  });
  // Remove visual animating state from detail items
  detailsContent?.querySelectorAll('.detail-sprite-item.animating').forEach(el => el.classList.remove('animating'));
}

function computeSpriteIndex(spriteInfo: CompleteSpriteInfo, layerIndex: number, x: number, y: number, z: number, phaseIndex: number): number {
  const layers = (spriteInfo.layers ?? spriteInfo.pattern_layers ?? 1);
  const pw = (spriteInfo.pattern_width ?? 1);
  const ph = (spriteInfo.pattern_height ?? 1);
  const pd = (spriteInfo.pattern_depth ?? 1);
  const frames = spriteInfo.animation ? spriteInfo.animation.phases.length : (spriteInfo.pattern_frames ?? 1);
  let idx = phaseIndex % frames;
  idx = idx * pd + (z || 0);
  idx = idx * ph + (y || 0);
  idx = idx * pw + (x || 0);
  idx = idx * layers + (layerIndex || 0);
  return idx;
}

function computeGroupOffsetsFromDetails(details: CompleteAppearanceItem): number[] {
  const offsets: number[] = [];
  let offset = 0;
  for (const fg of details.frame_groups) {
    const count = fg.sprite_info?.sprite_ids.length ?? 0;
    offsets.push(offset);
    offset += count;
  }
  return offsets;
}

function getGroupIndexForAggregatedSprite(details: CompleteAppearanceItem, aggregatedIndex: number, offsets: number[]): { groupIndex: number, localIndex: number } | null {
  for (let i = 0; i < details.frame_groups.length; i++) {
    const fg = details.frame_groups[i];
    const base = offsets[i];
    const size = fg.sprite_info?.sprite_ids.length ?? 0;
    if (aggregatedIndex >= base && aggregatedIndex < base + size) {
      return { groupIndex: i, localIndex: aggregatedIndex - base };
    }
  }
  return null;
}

function decomposeSpriteIndex(spriteInfo: CompleteSpriteInfo, localIndex: number): { layerIndex: number, x: number, y: number, z: number, phaseIndex: number } {
  const layers = (spriteInfo.layers ?? spriteInfo.pattern_layers ?? 1);
  const pw = (spriteInfo.pattern_width ?? 1);
  const ph = (spriteInfo.pattern_height ?? 1);
  const pd = (spriteInfo.pattern_depth ?? 1);
  const frames = spriteInfo.animation ? spriteInfo.animation.phases.length : (spriteInfo.pattern_frames ?? 1);
  let u = Math.floor(localIndex);
  const layerIndex = u % layers; u = Math.floor(u / layers);
  const x = u % pw; u = Math.floor(u / pw);
  const y = u % ph; u = Math.floor(u / ph);
  const z = u % pd; u = Math.floor(u / pd);
  const phaseIndex = u % frames;
  return { layerIndex, x, y, z, phaseIndex };
}

async function initAnimationPlayersForDetails(details: CompleteAppearanceItem, category: string) {
  try {
    const sprites = await getAppearanceSprites(category, details.id);
    const groupOffsets = computeGroupOffsetsFromDetails(details);

    details.frame_groups.forEach((fg, index) => {
      const spriteInfo = fg.sprite_info;
      if (!spriteInfo) return;
      const frames = spriteInfo.animation ? spriteInfo.animation.phases.length : (spriteInfo.pattern_frames ?? 1);
      if (frames <= 1) return;

      const containerSelector = `.frame-group-detail`;
      const detailSections = detailsContent?.querySelectorAll(containerSelector);
      const groupEl = detailSections ? detailSections[index] as HTMLElement : null;
      if (!groupEl) return;

      // Create player UI
      const player = document.createElement('div');
      player.className = 'animation-player';
      player.innerHTML = `
        <div class="anim-canvas">
          <img class="anim-sprite-image" alt="Animation">
          <span class="anim-phase-label">Fase 1</span>
        </div>
        <div class="anim-controls">
          <button class="btn-secondary anim-btn" data-action="play">Play</button>
          <button class="btn-secondary anim-btn" data-action="pause" disabled>Pause</button>
          <label class="anim-speed">Velocidade (ms)
            <input type="number" min="50" max="1000" step="50" value="${spriteInfo.animation?.phases?.[0]?.duration_min ?? 250}">
          </label>
        </div>
      `;
      groupEl.appendChild(player);

      const imgEl = player.querySelector('img') as HTMLImageElement;
      const phaseLabel = player.querySelector('.anim-phase-label') as HTMLElement;
      const playBtn = player.querySelector('button[data-action="play"]') as HTMLButtonElement;
      const pauseBtn = player.querySelector('button[data-action="pause"]') as HTMLButtonElement;
      const speedInput = player.querySelector('input[type="number"]') as HTMLInputElement;

      const key = `detail:${details.id}:${index}`;
      let phase = 0;
      const baseOffset = groupOffsets[index];
      const draw = () => {
        const spriteIdx = baseOffset + computeSpriteIndex(spriteInfo, 0, 0, 0, 0, phase);
        if (spriteIdx >= 0 && spriteIdx < sprites.length) {
          imgEl.src = `data:image/png;base64,${sprites[spriteIdx]}`;
          phaseLabel.textContent = `Fase ${phase + 1}`;
        }
      };
      draw();

      const start = () => {
        const speed = Math.max(50, Math.min(1000, parseInt(speedInput.value || '250', 10)));
        const loopType = spriteInfo.animation?.loop_type ?? 0; // -1: pingpong, 0: infinite, 1: counted
        const maxLoops = spriteInfo.animation?.loop_count;
        let direction = 1; // 1 forward, -1 backward
        let completedLoops = 0;
        const timerId = window.setInterval(() => {
          if (frames <= 1) return;
          if (loopType === -1) {
            // Ping-pong real
            phase += direction;
            if (phase >= frames - 1) {
              direction = -1;
            } else if (phase <= 0) {
              direction = 1;
            }
          } else if (loopType === 1) {
            // Counted loops
            phase += 1;
            if (phase >= frames) {
              phase = 0;
              completedLoops += 1;
              if (typeof maxLoops === 'number' && completedLoops >= maxLoops) {
                // Stop when reaching loop count
                clearInterval(timerId);
                activeAnimationPlayers.delete(key);
                playBtn.disabled = false;
                pauseBtn.disabled = true;
                return;
              }
            }
          } else {
            // Infinite loop
            phase = (phase + 1) % frames;
          }
          draw();
        }, speed);
        activeAnimationPlayers.set(key, timerId);
        playBtn.disabled = true;
        pauseBtn.disabled = false;
      };
      const stop = () => {
        const timerId = activeAnimationPlayers.get(key);
        if (timerId) {
          clearInterval(timerId);
          activeAnimationPlayers.delete(key);
        }
        playBtn.disabled = false;
        pauseBtn.disabled = true;
      };

      playBtn.addEventListener('click', start);
      pauseBtn.addEventListener('click', stop);
      speedInput.addEventListener('change', () => {
        if (activeAnimationPlayers.has(key)) {
          stop();
          start();
        }
      });
    });
  } catch (e) {
    console.error('Failed to init animation players:', e);
  }
}

function initDetailSpriteCardAnimations(appearanceId: number, sprites: string[]) {
  try {
    if (!currentAppearanceDetails) return;
    const details = currentAppearanceDetails;
    if (details.id !== appearanceId) return;

    const groupOffsets = computeGroupOffsetsFromDetails(details);
    const container = document.getElementById(`detail-sprites-${appearanceId}`);
    const cards = container?.querySelectorAll('.detail-sprite-item') ?? [];

    cards.forEach((card) => {
      const el = card as HTMLElement;
      const idxStr = el.getAttribute('data-agg-index');
      if (!idxStr) return;
      const aggIndex = parseInt(idxStr, 10);
      const mapping = getGroupIndexForAggregatedSprite(details, aggIndex, groupOffsets);
      if (!mapping) return;
      const { groupIndex, localIndex } = mapping;
      const spriteInfo = details.frame_groups[groupIndex]?.sprite_info;
      if (!spriteInfo) return;
      const frames = spriteInfo.animation ? spriteInfo.animation.phases.length : (spriteInfo.pattern_frames ?? 1);
      if (frames <= 1) return; // Only animate if more than one frame

      const imgEl = el.querySelector('img.detail-sprite-image') as HTMLImageElement | null;
      if (!imgEl) return;

      const baseOffset = groupOffsets[groupIndex];
      const dims = decomposeSpriteIndex(spriteInfo, localIndex);
      const key = `card:${appearanceId}:${aggIndex}`;
      let phase = dims.phaseIndex;

      const draw = () => {
        const spriteIdx = baseOffset + computeSpriteIndex(spriteInfo, dims.layerIndex, dims.x, dims.y, dims.z, phase);
        if (spriteIdx >= 0 && spriteIdx < sprites.length) {
          imgEl.src = `data:image/png;base64,${sprites[spriteIdx]}`;
        }
      };

      const start = () => {
        const speed = Math.max(50, Math.min(1000, spriteInfo.animation?.phases?.[0]?.duration_min ?? 250));
        const loopType = spriteInfo.animation?.loop_type ?? 0; // -1: pingpong, 0: infinite, 1: counted
        const maxLoops = spriteInfo.animation?.loop_count;
        let direction = 1; // 1 forward, -1 backward
        let completedLoops = 0;
        const timerId = window.setInterval(() => {
          if (frames <= 1) return;
          if (loopType === -1) {
            // Ping-pong real
            phase += direction;
            if (phase >= frames - 1) {
              direction = -1;
            } else if (phase <= 0) {
              direction = 1;
            }
          } else if (loopType === 1) {
            // Contagem
            phase += 1;
            if (phase >= frames) {
              phase = 0;
              completedLoops += 1;
              if (typeof maxLoops === 'number' && completedLoops >= maxLoops) {
                clearInterval(timerId);
                activeAnimationPlayers.delete(key);
                el.classList.remove('animating');
                // Restaura frame original
                const spriteIdx = aggIndex;
                if (spriteIdx >= 0 && spriteIdx < sprites.length) {
                  imgEl.src = `data:image/png;base64,${sprites[spriteIdx]}`;
                }
                return;
              }
            }
          } else {
            // Infinito
            phase = (phase + 1) % frames;
          }
          draw();
        }, speed);
        activeAnimationPlayers.set(key, timerId);
        el.classList.add('animating');
      };

      const stop = () => {
        const timerId = activeAnimationPlayers.get(key);
        if (timerId) {
          clearInterval(timerId);
          activeAnimationPlayers.delete(key);
        }
        el.classList.remove('animating');
        // Restore the original frame
        const spriteIdx = aggIndex;
        if (spriteIdx >= 0 && spriteIdx < sprites.length) {
          imgEl.src = `data:image/png;base64,${sprites[spriteIdx]}`;
        }
      };

      el.addEventListener('click', () => {
        if (activeAnimationPlayers.has(key)) {
          stop();
        } else {
          start();
        }
      });
    });
  } catch (e) {
    console.error('Failed to init sprite card animations:', e);
  }
}

// Sprite loading and visualization functions

function initAssetCardAutoAnimation(category: string, appearanceId: number, sprites: string[]) {
  (async () => {
    try {
      const container = document.getElementById(`sprite-${appearanceId}`) as HTMLElement | null;
      const imgEl = container?.querySelector('img') as HTMLImageElement | null;
      if (!container || !imgEl) return;

      const details = await invoke("get_complete_appearance", { category, id: appearanceId }) as CompleteAppearanceItem;
      if (!autoAnimateGridEnabled) return;

      const groupOffsets = computeGroupOffsetsFromDetails(details);
      // Choose the first animated frame group, not necessarily aggregated index 0
      let groupIndex = -1;
      for (let i = 0; i < details.frame_groups.length; i++) {
        const si = details.frame_groups[i]?.sprite_info;
        const f = si ? (si.animation ? si.animation.phases.length : (si.pattern_frames ?? 1)) : 0;
        if (f > 1) { groupIndex = i; break; }
      }
      if (groupIndex < 0) return; // No animated group
      const spriteInfo = details.frame_groups[groupIndex]?.sprite_info;
      if (!spriteInfo) return;
      const frames = spriteInfo.animation ? spriteInfo.animation.phases.length : (spriteInfo.pattern_frames ?? 1);
      if (frames <= 1) return;

      const baseOffset = groupOffsets[groupIndex];
      // Use local index 0 of this group (layer/x/y/z = 0, phase = 0)
      const dims = decomposeSpriteIndex(spriteInfo, 0);
      const key = `asset:${category}:${appearanceId}`;
      let phase = dims.phaseIndex;

      const draw = () => {
        const spriteIdx = baseOffset + computeSpriteIndex(spriteInfo, dims.layerIndex, dims.x, dims.y, dims.z, phase);
        if (spriteIdx >= 0 && spriteIdx < sprites.length) {
          imgEl.src = `data:image/png;base64,${sprites[spriteIdx]}`;
        }
      };
      draw();

      const start = () => {
        const speed = Math.max(50, Math.min(1000, spriteInfo.animation?.phases?.[0]?.duration_min ?? 250));
        const timerId = window.setInterval(() => {
          if (frames <= 1) return;
          // Loop infinito para todos os itens da grade
          phase = (phase + 1) % frames;
          draw();
        }, speed);
        activeAnimationPlayers.set(key, timerId);
        container.classList.add('animating');
      };

      start();
    } catch (e) {
      console.warn('Failed to init auto animation for asset card:', e);
    }
  })();
}

let spritesLoaded = false;
let spritesLoadAttempted = false;

// Sprite cache to avoid reloading the same sprites
const spriteCache = new Map<string, string[]>();

function getSpritesCacheKey(category: string, appearanceId: number): string {
  return `${category}:${appearanceId}`;
}

function clearSpritesCache() {
  spriteCache.clear();
}

function getSpriteCacheStats() {
  const totalEntries = spriteCache.size;
  let totalSprites = 0;
  for (const sprites of spriteCache.values()) {
    totalSprites += sprites.length;
  }
  return { totalEntries, totalSprites };
}

async function clearBackendSpriteCache() {
  try {
    const clearedEntries = await invoke('clear_sprite_cache') as number;
    return clearedEntries;
  } catch (error) {
    console.error("Error clearing backend sprite cache:", error);
    return 0;
  }
}

async function getBackendSpriteCacheStats() {
  try {
    const [totalEntries, totalSprites] = await invoke('get_sprite_cache_stats') as [number, number];
    return { totalEntries, totalSprites };
  } catch (error) {
    console.error("Error getting backend sprite cache stats:", error);
    return { totalEntries: 0, totalSprites: 0 };
  }
}

async function clearAllCaches() {
  clearSpritesCache(); // Frontend cache
  await clearBackendSpriteCache(); // Backend cache
}

async function loadSprites() {
  if (spritesLoadAttempted) {
    return;
  }
  spritesLoadAttempted = true;
  if (spritesLoaded) return;

  try {
    // Use the user-provided Tibia path instead of calling select_tibia_directory
    const tibiaPath = userTibiaPath || await invoke('select_tibia_directory') as string;
    if (!tibiaPath) return;

    // Try to auto-load sprites from Tibia 12+ format
    try {
      const spriteCount = await invoke('auto_load_sprites', { tibiaPath }) as number;
      console.log(`Auto-loaded ${spriteCount} sprites from Tibia 12+ format`);
      spritesLoaded = true;
      return;
    } catch (error) {
      console.warn('Failed to auto-load Tibia 12+ sprites:', error);
    }

    console.warn('No compatible sprite format found in Tibia directory');
  } catch (error) {
    console.error('Error loading sprites:', error);
  }
}

async function getAppearanceSprites(category: string, appearanceId: number): Promise<string[]> {
  // Check cache first
  const cacheKey = getSpritesCacheKey(category, appearanceId);
  if (spriteCache.has(cacheKey)) {
    return spriteCache.get(cacheKey)!;
  }

  if (!spritesLoaded) {
    await loadSprites();
  }

  if (!spritesLoaded) {
    return [];
  }

  try {
    const sprites = await invoke('get_appearance_sprites', {
      category: category,
      appearanceId: appearanceId
    }) as string[];

    // Store in cache
    spriteCache.set(cacheKey, sprites);

    return sprites;
  } catch (error) {
    console.error(`Error getting sprites for ${category} ${appearanceId}:`, error);
    return [];
  }
}

function createSpriteImage(base64Data: string): HTMLImageElement {
  const img = document.createElement('img');
  img.src = `data:image/png;base64,${base64Data}`;
  img.className = 'sprite-image';
  img.style.imageRendering = 'pixelated';
  return img;
}

function createPlaceholderImage(): HTMLDivElement {
  const placeholder = document.createElement('div');
  placeholder.className = 'sprite-placeholder';
  placeholder.style.display = 'flex';
  placeholder.style.alignItems = 'center';
  placeholder.style.justifyContent = 'center';
  placeholder.style.fontSize = '10px';
  placeholder.style.color = '#888';
  placeholder.textContent = '?';
  return placeholder;
}



// Debug functions for testing cache
window.debugCache = {
    // Frontend cache stats
    getFrontendCacheStats: () => {
        return getSpriteCacheStats();
    },
    
    // Backend cache stats
    getBackendCacheStats: async () => {
        return await getBackendSpriteCacheStats();
    },
    
    // Clear frontend cache
    clearFrontendCache: () => {
        clearSpritesCache();
        return 'Frontend cache cleared';
    },

    // Clear backend cache
    clearBackendCache: async () => {
        const count = await clearBackendSpriteCache();
        return `Backend cache cleared (${count} entries)`;
    },

    // Clear all caches
    clearAllCaches: async () => {
        await clearAllCaches();
        return 'All caches cleared';
    },
    
    // Test cache behavior
    testCache: async (category: string, id: number) => {
        console.log(`Testing cache for ${category} ID ${id}`);
        
        // First call - should be cache miss
        console.time('First call (cache miss)');
        const sprites1 = await getAppearanceSprites(category, id);
        console.timeEnd('First call (cache miss)');
        
        // Second call - should be cache hit
        console.time('Second call (cache hit)');
        const sprites2 = await getAppearanceSprites(category, id);
        console.timeEnd('Second call (cache hit)');
        
        console.log('First call sprites:', sprites1.length);
        console.log('Second call sprites:', sprites2.length);
        console.log('Cache stats:', getSpriteCacheStats());
        
        return { sprites1, sprites2 };
    }
};
