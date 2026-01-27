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
import { loadSpritesForAssets } from '../utils/spriteLoading';
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
      let soundItems: any[] = [];
      
      if (sub === 'Ambience Streams') {
         soundItems = await invoke('list_ambience_streams', { page, pageSize: size });
         total = await invoke('get_ambience_stream_count');
      } else if (sub === 'Ambience Object Streams') {
         soundItems = await invoke('list_ambience_object_streams', { page, pageSize: size });
         total = await invoke('get_ambience_object_stream_count');
      } else if (sub === 'Music Templates') {
         soundItems = await invoke('list_music_templates', { page, pageSize: size });
         total = await invoke('get_music_template_count');
      } else {
         // Default to Sound Effects
         const typeFilter = sub !== 'All' ? sub : null;
         soundItems = await invoke('list_numeric_sound_effects', { page, pageSize: size, soundType: typeFilter });
         // Note: Count might be inaccurate if filtered, but backend limitation for now
         total = await invoke('get_sound_effect_count'); 
      }
      
      // Map to compatible structure for the store
      items = soundItems.map(s => ({
         id: s.id,
         name: s.filename || s.sound_type || `Sound #${s.id}`,
         description: '',
         flags: {} as any // Empty flags
      })) as unknown as CompleteAppearanceItem[];
      
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
    
    // Sprite loading is now handled reactively by CategoryView
    // This avoids race conditions and ensures DOM elements exist before loading

  } catch (error) {
    console.error('Error loading assets:', error);
  } finally {
    isLoading.set(false);
  }
}
