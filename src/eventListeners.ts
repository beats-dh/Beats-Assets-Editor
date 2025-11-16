import { showAssetDetails, closeAssetDetails, refreshAssetDetails, getCurrentAppearanceDetails } from './assetDetails';
import { openCategory, openCategoryWithSubcategory, goBack } from './navigation';
import {
  saveAssetBasicInfo,
  saveAssetLight,
  saveAssetShift,
  saveAssetHeight,
  saveAssetWrite,
  saveAssetWriteOnce,
  saveAssetAutomap,
  saveAssetHook,
  saveAssetLenshelp,
  saveAssetClothes,
  saveAssetDefaultAction,
  saveAssetMarket,
  saveAssetBank,
  saveAssetChangedToExpire,
  saveAssetCyclopediaItem,
  saveAssetUpgradeClassification,
  saveAssetSkillwheelGem,
  saveAssetImbueable,
  saveAssetProficiency,
  saveAssetWeaponType,
  saveAssetTransparencyLevel,
  saveFlagCheckbox
} from './assetSave';
import { getPrimarySelection, isAssetSelected, setAssetSelection } from './assetSelection';

export function setupGlobalEventListeners(): void {
  // Global click listener for category navigation and all save buttons
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const mouseEvent = e as MouseEvent;

    if (target.closest('.asset-select-control')) {
      return;
    }

    // Handle category card clicks
    if (target.closest('.category-card')) {
      const categoryCard = target.closest('.category-card') as HTMLElement;
      const category = categoryCard.dataset.category;
      if (category) {
        openCategory(category);
      }
    }

    // Handle subcategory card clicks
    if (target.closest('.subcategory-card')) {
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
      const assetId = (assetItem as HTMLElement).dataset.assetId;
      const category = (assetItem as HTMLElement).dataset.category;
      if (assetId && category) {
        const parsedId = parseInt(assetId, 10);
        if (!Number.isNaN(parsedId)) {
          if (shouldHandleCtrlSelection(mouseEvent, category, parsedId)) {
            return;
          }
          await showAssetDetails(category, parsedId);
        }
      } else {
        console.error('Missing assetId or category in dataset');
      }
    }

    // Handle save basic info button click
    const saveBasicBtn = target.closest('#save-basic-info') as HTMLElement | null;
    if (saveBasicBtn) {
      const cat = saveBasicBtn.dataset.category;
      const idStr = saveBasicBtn.dataset.id;
      if (cat && idStr) {
        await saveAssetBasicInfo(cat, parseInt(idStr, 10), async () => {
          await refreshAssetDetails(cat, parseInt(idStr, 10));
        });
      }
    }

    // Handle spinner buttons
    await handleSpinnerButtons(e, target);

    // Handle all save buttons
    await handleSaveButtons(e, target);

    // Handle flag checkbox toggle
    await handleFlagCheckbox(e, target);

    // Handle modal tab switching
    handleModalTabs(e, target);

    // Handle back button clicks
    if (target.closest('.modern-back-btn') || target.closest('#back-btn')) {
      goBack();
    }
  });

  // Close details button
  document.querySelector('#close-details')?.addEventListener('click', closeAssetDetails);

  document.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    if (target && target.classList.contains('asset-select-checkbox')) {
      const { assetId, category } = target.dataset;
      if (assetId && category) {
        const parsedId = parseInt(assetId, 10);
        if (!Number.isNaN(parsedId)) {
          setAssetSelection(category, parsedId, target.checked);
        }
      }
    }
  });
}

function getAssetItemsInOrder(category: string): HTMLElement[] {
  const grid = document.querySelector('#assets-grid');
  if (!grid) {
    return [];
  }
  return Array.from(grid.querySelectorAll<HTMLElement>(`.asset-item[data-category="${category}"]`));
}

function shouldHandleCtrlSelection(event: MouseEvent, category: string, assetId: number): boolean {
  if (!event.ctrlKey && !event.metaKey) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();

  const items = getAssetItemsInOrder(category);
  const targetIndex = items.findIndex((item) => parseInt(item.dataset.assetId ?? '', 10) === assetId);
  const primary = getPrimarySelection();

  if (!primary || primary.category !== category) {
    setAssetSelection(category, assetId, !isAssetSelected(category, assetId));
    return true;
  }

  const primaryIndex = items.findIndex((item) => parseInt(item.dataset.assetId ?? '', 10) === primary.id);
  if (primaryIndex === -1 || targetIndex === -1) {
    setAssetSelection(category, assetId, !isAssetSelected(category, assetId));
    return true;
  }

  const start = Math.min(primaryIndex, targetIndex);
  const end = Math.max(primaryIndex, targetIndex);
  for (let i = start; i <= end; i += 1) {
    const id = parseInt(items[i].dataset.assetId ?? '', 10);
    if (!Number.isNaN(id)) {
      setAssetSelection(category, id, true);
    }
  }

  return true;
}

async function handleSpinnerButtons(_e: Event, target: HTMLElement): Promise<void> {
  const spinnerUp = target.closest('.spinner-up') as HTMLElement | null;
  if (spinnerUp) {
    _e.preventDefault();
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
    _e.preventDefault();
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
}

async function handleSaveButtons(_e: Event, target: HTMLElement): Promise<void> {
  const saveButtons = [
    { id: '#save-light', handler: saveAssetLight },
    { id: '#save-shift', handler: saveAssetShift },
    { id: '#save-height', handler: saveAssetHeight },
    { id: '#save-write', handler: saveAssetWrite },
    { id: '#save-write-once', handler: saveAssetWriteOnce },
    { id: '#save-automap', handler: saveAssetAutomap },
    { id: '#save-hook', handler: saveAssetHook },
    { id: '#save-lenshelp', handler: saveAssetLenshelp },
    { id: '#save-clothes', handler: saveAssetClothes },
    { id: '#save-default-action', handler: saveAssetDefaultAction },
    { id: '#save-market', handler: saveAssetMarket },
    { id: '#save-bank', handler: saveAssetBank },
    { id: '#save-changed-to-expire', handler: saveAssetChangedToExpire },
    { id: '#save-cyclopedia-item', handler: saveAssetCyclopediaItem },
    { id: '#save-upgrade-classification', handler: saveAssetUpgradeClassification },
    { id: '#save-skillwheel-gem', handler: saveAssetSkillwheelGem },
    { id: '#save-imbueable', handler: saveAssetImbueable },
    { id: '#save-proficiency', handler: saveAssetProficiency },
    { id: '#save-weapon-type', handler: saveAssetWeaponType },
    { id: '#save-transparency-level', handler: saveAssetTransparencyLevel },
  ];

  for (const { id, handler } of saveButtons) {
    const btn = target.closest(id) as HTMLElement | null;
    if (btn) {
      const cat = btn.dataset.category;
      const idStr = btn.dataset.id;
      if (cat && idStr) {
        const currentDetails = getCurrentAppearanceDetails();
        await handler(cat, parseInt(idStr, 10), async () => {
          await refreshAssetDetails(cat, parseInt(idStr, 10));
        }, currentDetails as any);
      } else {
        console.error(`Missing data attributes on ${id} button`);
      }
      return; // Stop after handling one button
    }
  }
}

async function handleFlagCheckbox(_e: Event, target: HTMLElement): Promise<void> {
  const flagCheckbox = target.closest('.flag-checkbox') as HTMLInputElement | null;
  if (flagCheckbox) {
    const cat = flagCheckbox.dataset.category;
    const idStr = flagCheckbox.dataset.id;
    const flagKey = flagCheckbox.dataset.flag;
    const checked = (flagCheckbox as HTMLInputElement).checked;
    if (cat && idStr && flagKey) {
      try {
        await saveFlagCheckbox(cat, parseInt(idStr, 10), flagKey, checked);
        await refreshAssetDetails(cat, parseInt(idStr, 10));
      } catch (err) {
        console.error('Failed to update flag', flagKey, err);
        // Revert checkbox state
        flagCheckbox.checked = !checked;
      }
    } else {
      console.error('Missing data attributes on flag checkbox');
    }
  }
}

function handleModalTabs(_e: Event, target: HTMLElement): void {
  const tabClick = target.closest('.tab-btn') as HTMLElement | null;
  if (tabClick) {
    const tab = tabClick.dataset.tab;
    const editContainer = document.getElementById('edit-content');
    const detailsContainer = document.getElementById('details-content');
    const textureContainer = document.getElementById('texture-content');
    const tabEdit = document.getElementById('tab-edit');
    const tabDetails = document.getElementById('tab-details');
    const tabTexture = document.getElementById('tab-texture');

    const containers = [detailsContainer, editContainer, textureContainer];
    containers.forEach((container) => {
      if (container) {
        container.style.display = 'none';
      }
    });

    tabDetails?.classList.remove('active');
    tabEdit?.classList.remove('active');
    tabTexture?.classList.remove('active');

    if (tab === 'edit' && editContainer) {
      editContainer.style.display = 'block';
      tabEdit?.classList.add('active');
    } else if (tab === 'texture' && textureContainer) {
      textureContainer.style.display = 'block';
      tabTexture?.classList.add('active');
    } else if (detailsContainer) {
      detailsContainer.style.display = 'block';
      tabDetails?.classList.add('active');
    }
  }
}
