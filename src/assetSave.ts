import { invoke } from '@tauri-apps/api/core';

// Generic save helper to reduce repetition
async function saveWithFeedback(
  buttonId: string,
  saveCallback: () => Promise<void>
): Promise<void> {
  try {
    await saveCallback();
    await invoke('save_appearances_file');

    const btn = document.getElementById(buttonId) as HTMLButtonElement | null;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Salvo!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = oldText || 'Salvar';
        btn.disabled = false;
      }, 1200);
    }
  } catch (err) {
    console.error(`Erro ao salvar ${buttonId}:`, err);
    alert(`Falha ao salvar. Veja o console para detalhes.`);
  }
}

// Refresh asset details after save
export async function refreshAssetDetails(
  category: string,
  id: number,
  displayFunction: (details: any, category: string) => Promise<void>
): Promise<void> {
  try {
    const updated = await invoke('get_complete_appearance', { category, id });
    await displayFunction(updated, category);
  } catch (err) {
    console.error('Falha ao atualizar detalhes do item:', err);
  }
}

// Save basic info (name + description)
export async function saveAssetBasicInfo(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-basic-info', async () => {
    const inputName = document.getElementById('asset-name-input') as HTMLInputElement | null;
    const inputDesc = document.getElementById('asset-description-input') as HTMLTextAreaElement | null;
    if (!inputName || !inputDesc) return;

    const newName = inputName.value?.trim() || '';
    if (!newName) {
      alert('O nome não pode ser vazio.');
      throw new Error('Empty name');
    }
    const newDescription = inputDesc.value?.trim() || '';

    await invoke('update_appearance_name', { category, id, newName });
    await invoke('update_appearance_description', { category, id, newDescription });

    // Update UI immediately
    const nameValue = document.getElementById('detail-name-value');
    if (nameValue) nameValue.textContent = newName;
    const sel = `.asset-item[data-asset-id="${id}"][data-category="${category}"] .asset-name`;
    const gridNameEl = document.querySelector(sel) as HTMLElement | null;
    if (gridNameEl) gridNameEl.textContent = newName;
  });
  await onRefresh();
}

// Save Light properties
export async function saveAssetLight(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-light', async () => {
    const bEl = document.getElementById('light-brightness') as HTMLInputElement | null;
    const cEl = document.getElementById('light-color') as HTMLInputElement | null;
    const brightness = bEl && bEl.value !== '' ? parseInt(bEl.value, 10) : null;
    const color = cEl && cEl.value !== '' ? parseInt(cEl.value, 10) : null;
    await invoke('update_appearance_light', { category, id, brightness, color });
  });
  await onRefresh();
}

// Save Shift properties
export async function saveAssetShift(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-shift', async () => {
    const xEl = document.getElementById('shift-x') as HTMLInputElement | null;
    const yEl = document.getElementById('shift-y') as HTMLInputElement | null;
    const x = xEl && xEl.value !== '' ? parseInt(xEl.value, 10) : null;
    const y = yEl && yEl.value !== '' ? parseInt(yEl.value, 10) : null;
    await invoke('update_appearance_shift', { category, id, x, y });
  });
  await onRefresh();
}

// Save Height
export async function saveAssetHeight(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-height', async () => {
    const eEl = document.getElementById('height-elevation') as HTMLInputElement | null;
    const elevation = eEl && eEl.value !== '' ? parseInt(eEl.value, 10) : null;
    await invoke('update_appearance_height', { category, id, elevation });
  });
  await onRefresh();
}

// Save Write
export async function saveAssetWrite(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-write', async () => {
    const wEl = document.getElementById('write-max-text-length') as HTMLInputElement | null;
    const maxTextLength = wEl && wEl.value !== '' ? parseInt(wEl.value, 10) : null;
    await invoke('update_appearance_write', { category, id, maxTextLength });
  });
  await onRefresh();
}

// Save Write Once
export async function saveAssetWriteOnce(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-write-once', async () => {
    const wEl = document.getElementById('write-once-max-text-length') as HTMLInputElement | null;
    const maxTextLengthOnce = wEl && wEl.value !== '' ? parseInt(wEl.value, 10) : null;
    await invoke('update_appearance_write_once', { category, id, maxTextLengthOnce });
  });
  await onRefresh();
}

// Save Automap
export async function saveAssetAutomap(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-automap', async () => {
    const el = document.getElementById('automap-color') as HTMLInputElement | null;
    const color = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_automap', { category, id, color });
  });
  await onRefresh();
}

// Save Hook
export async function saveAssetHook(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-hook', async () => {
    const el = document.getElementById('hook-direction') as HTMLSelectElement | null;
    const direction = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_hook', { category, id, direction });
  });
  await onRefresh();
}

// Save Lenshelp
export async function saveAssetLenshelp(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-lenshelp', async () => {
    const el = document.getElementById('lenshelp-id') as HTMLInputElement | null;
    const lenshelpId = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_lenshelp', { category, id, lenshelpId });
  });
  await onRefresh();
}

// Save Clothes
export async function saveAssetClothes(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-clothes', async () => {
    const el = document.getElementById('clothes-slot') as HTMLSelectElement | null;
    const slot = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_clothes', { category, id, slot });
  });
  await onRefresh();
}

// Save Default Action
export async function saveAssetDefaultAction(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-default-action', async () => {
    const el = document.getElementById('default-action') as HTMLSelectElement | null;
    const action = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_default_action', { category, id, action });
  });
  await onRefresh();
}

// Save Market
export async function saveAssetMarket(category: string, id: number, onRefresh: () => Promise<void>, _details: any): Promise<void> {
  await saveWithFeedback('save-market', async () => {
    const catEl = document.getElementById('market-category') as HTMLSelectElement | null;
    const tradeEl = document.getElementById('market-trade-as-object-id') as HTMLInputElement | null;
    const showEl = document.getElementById('market-show-as-object-id') as HTMLInputElement | null;
    const restEl = document.getElementById('market-restrict-to-vocation') as HTMLSelectElement | null;
    const minLvlEl = document.getElementById('market-minimum-level') as HTMLInputElement | null;
    const nameEl = document.getElementById('market-name') as HTMLInputElement | null;
    const vocEl = document.getElementById('market-vocation') as HTMLSelectElement | null;

    const categoryValue = catEl && catEl.value !== '' ? parseInt(catEl.value, 10) : null;
    const tradeAsObjectId = tradeEl && tradeEl.value !== '' ? parseInt(tradeEl.value, 10) : null;
    const showAsObjectId = showEl && showEl.value !== '' ? parseInt(showEl.value, 10) : null;
    const minimumLevel = minLvlEl && minLvlEl.value !== '' ? parseInt(minLvlEl.value, 10) : null;
    const restrictToVocation = restEl && restEl.value !== '' ? [parseInt(restEl.value, 10)] : [];
    const name = nameEl && nameEl.value !== '' ? nameEl.value : null;
    const vocation = vocEl && vocEl.value !== '' ? parseInt(vocEl.value, 10) : null;

    await invoke('update_appearance_market', {
      category, id, categoryValue, tradeAsObjectId, showAsObjectId,
      restrictToVocation, minimumLevel, name, vocation,
    });
  });
  await onRefresh();
}

// Save Bank
export async function saveAssetBank(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-bank', async () => {
    const el = document.getElementById('bank-waypoints') as HTMLInputElement | null;
    const waypoints = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_bank', { category, id, waypoints });
  });
  await onRefresh();
}

// Additional save functions for other properties
export async function saveAssetChangedToExpire(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-changed-to-expire', async () => {
    const el = document.getElementById('changed-to-expire-former-id') as HTMLInputElement | null;
    const formerObjectTypeid = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_changed_to_expire', { category, id, formerObjectTypeid });
  });
  await onRefresh();
}

export async function saveAssetCyclopediaItem(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-cyclopedia-item', async () => {
    const el = document.getElementById('cyclopedia-type') as HTMLInputElement | null;
    const cyclopediaType = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_cyclopedia_item', { category, id, cyclopediaType });
  });
  await onRefresh();
}

export async function saveAssetUpgradeClassification(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-upgrade-classification', async () => {
    const el = document.getElementById('upgrade-classification') as HTMLInputElement | null;
    const upgradeClassification = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_upgrade_classification', { category, id, upgradeClassification });
  });
  await onRefresh();
}

export async function saveAssetSkillwheelGem(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-skillwheel-gem', async () => {
    const qEl = document.getElementById('skillwheel-gem-quality-id') as HTMLInputElement | null;
    const vEl = document.getElementById('skillwheel-vocation-id') as HTMLSelectElement | null;
    const gemQualityId = qEl && qEl.value !== '' ? parseInt(qEl.value, 10) : null;
    const vocationId = vEl && vEl.value !== '' ? parseInt(vEl.value, 10) : null;
    await invoke('update_appearance_skillwheel_gem', { category, id, gemQualityId, vocationId });
  });
  await onRefresh();
}

export async function saveAssetImbueable(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-imbueable', async () => {
    const el = document.getElementById('imbueable-slot-count') as HTMLInputElement | null;
    const slotCount = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_imbueable', { category, id, slotCount });
  });
  await onRefresh();
}

export async function saveAssetProficiency(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-proficiency', async () => {
    const el = document.getElementById('proficiency-id') as HTMLInputElement | null;
    const proficiencyId = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_proficiency', { category, id, proficiencyId });
  });
  await onRefresh();
}

export async function saveAssetWeaponType(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-weapon-type', async () => {
    const el = document.getElementById('weapon-type') as HTMLSelectElement | null;
    const weaponType = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_weapon_type', { category, id, weaponType });
  });
  await onRefresh();
}

export async function saveAssetTransparencyLevel(category: string, id: number, onRefresh: () => Promise<void>): Promise<void> {
  await saveWithFeedback('save-transparency-level', async () => {
    const el = document.getElementById('transparency-level') as HTMLInputElement | null;
    const transparencyLevel = el && el.value !== '' ? parseInt(el.value, 10) : null;
    await invoke('update_appearance_transparency_level', { category, id, transparencyLevel });
  });
  await onRefresh();
}

// Save flag checkbox
export async function saveFlagCheckbox(category: string, id: number, flag: string, value: boolean): Promise<void> {
  try {
    await invoke('update_appearance_flag_bool', { category, id, flag, value });
    await invoke('save_appearances_file');
  } catch (err) {
    console.error('Failed to update flag', flag, err);
    alert('Falha ao atualizar flag: ' + flag);
    throw err;
  }
}
