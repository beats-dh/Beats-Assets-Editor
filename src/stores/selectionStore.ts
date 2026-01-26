import { writable } from 'svelte/store';
import type { CompleteAppearanceItem } from '../types';

export const selectedAsset = writable<CompleteAppearanceItem | null>(null);
export const isDetailsModalOpen = writable<boolean>(false);
export const activeTab = writable<'details' | 'edit' | 'texture'>('details');

export function openAssetDetails(asset: CompleteAppearanceItem) {
  selectedAsset.set(asset);
  activeTab.set('details');
  isDetailsModalOpen.set(true);
}

export function closeAssetDetails() {
  isDetailsModalOpen.set(false);
  selectedAsset.set(null);
}
