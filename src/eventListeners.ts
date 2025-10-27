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

export function setupGlobalEventListeners(): void {
  // Global click listener for category navigation and all save buttons
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
        await showAssetDetails(category, parseInt(assetId));
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
