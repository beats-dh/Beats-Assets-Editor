import { get } from 'svelte/store';
import { invoke } from '../utils/invoke';
import { COMMANDS } from '../commands';
import { 
  assets, 
  totalItems, 
  currentPage, 
  pageSize, 
  currentCategory, 
  currentSubcategory, 
  searchQuery, 
  isLoading 
} from '../stores/assetsStore';
import { loadSpritesForAssets } from '../assetUI';
import type { CompleteAppearanceItem } from '../types';

export async function loadAssetsData(append = false) {
  isLoading.set(true);
  
  const category = get(currentCategory);
  const page = get(currentPage);
  const size = get(pageSize);
  const search = get(searchQuery);
  const sub = get(currentSubcategory);
  
  try {
    let items: CompleteAppearanceItem[] = [];
    let total = 0;

    if (category === 'Sounds') {
      // Logic for sounds (simplified for now, mimicking assetUI.ts structure)
      // We might need to handle specific sound types
      // For now, let's assume standard listing for simplicity or implement full logic
      
      // const soundType = sub !== 'All' ? sub : null;
      // Note: This call signature depends on the backend. 
      // assetUI.ts has different branches for Ambience Streams etc.
      // For this MVP step, I'll focus on standard appearances first.
      // If category is Sounds, we might need to update the types in assetsStore to allow Sound items
      // But CompleteAppearanceItem is for appearances.
      // We'll skip Sounds full implementation for this exact moment and focus on visual assets
      
    } else {
      // Standard Appearance Assets
      const response = await invoke<{ total: number; items: CompleteAppearanceItem[] }>(COMMANDS.LIST_APPEARANCES_BY_CATEGORY, {
        category: category,
        page: page,
        pageSize: size,
        search: search || null,
        subcategory: category === 'Objects' && sub !== 'All' ? sub : null
      });
      
      items = response.items;
      total = response.total;
    }

    if (append) {
      assets.update(current => [...current, ...items]);
    } else {
      assets.set(items);
    }
    
    totalItems.set(total);
    
    // Trigger sprite loading
    // We need to wait for Svelte to render the DOM elements
    requestAnimationFrame(() => {
      loadSpritesForAssets(items);
    });

  } catch (error) {
    console.error('Error loading assets:', error);
  } finally {
    isLoading.set(false);
  }
}
