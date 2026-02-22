/**
 * Sprite URL Cache Unificado
 * 
 * Módulo centralizado para gerenciar URLs de sprites (Blob URLs)
 * Evita criar múltiplas URLs do mesmo buffer e centraliza limpeza
 */

const spriteUrlCache = new WeakMap<Uint8Array, string>();
const urlRegistry = new Set<string>();

/**
 * Obtém ou cria uma Blob URL para um buffer de sprite
 * @param buffer - Buffer do sprite Uint8Array
 * @returns Blob URL string
 */
export function getSpriteUrl(buffer: Uint8Array): string {
  const cached = spriteUrlCache.get(buffer);
  if (cached) return cached;
  
  // Usar slice() para garantir ArrayBuffer (evita SharedArrayBuffer)
  const arrayBuffer = buffer.slice().buffer;
  const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'image/png' }));
  
  spriteUrlCache.set(buffer, url);
  urlRegistry.add(url);
  return url;
}

/**
 * Limpa todas as Blob URLs criadas
 * Deve ser chamado quando os sprites não forem mais necessários
 */
export function clearSpriteUrlCache(): void {
  urlRegistry.forEach(url => URL.revokeObjectURL(url));
  urlRegistry.clear();
}

/**
 * Obtém estatísticas do cache
 * @returns Número de URLs registradas
 */
export function getSpriteUrlCacheStats(): number {
  return urlRegistry.size;
}

/**
 * Verifica se um buffer já tem URL cacheada
 * @param buffer - Buffer para verificar
 * @returns true se já tiver URL cacheada
 */
export function hasSpriteUrl(buffer: Uint8Array): boolean {
  return spriteUrlCache.has(buffer);
}
