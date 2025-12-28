/**
 * Lazy Loading Utilities
 * 
 * Dynamic imports for code splitting and lazy loading of heavy features
 */

/**
 * Lazy load monster editor
 */
export async function loadMonsterEditor(): Promise<any> {
  return await import('../monsterEditor');
}

/**
 * Lazy load sound editor features
 */
export async function loadSoundEditor(): Promise<any> {
  return await import('../sounds');
}

/**
 * Lazy load NPC editor
 */
export async function loadNPCEditor(): Promise<any> {
  return await import('../npcEditor');
}

/**
 * Preload a module in the background
 */
export function preloadModule(modulePath: string): void {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = modulePath;
  document.head.appendChild(link);
}

/**
 * Check if a feature should be lazy loaded
 */
export function shouldLazyLoad(featureName: string): boolean {
  // Lazy load heavy features
  const lazyFeatures = ['monsters', 'sounds', 'npc'];
  return lazyFeatures.includes(featureName.toLowerCase());
}

/**
 * Lazy load module by name
 */
export async function lazyLoadModule(moduleName: string): Promise<any> {
  switch (moduleName.toLowerCase()) {
    case 'monsters':
      return loadMonsterEditor();
    case 'sounds':
      return loadSoundEditor();
    case 'npc':
      return loadNPCEditor();
    default:
      throw new Error(`Unknown module: ${moduleName}`);
  }
}
