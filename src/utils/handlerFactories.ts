/**
 * Event Handler Factories using Closures (Partial Application)
 *
 * Instead of creating new arrow functions on every render cycle,
 * these factories capture parameters via closure and return a
 * stable function reference. This avoids unnecessary allocations
 * in hot render paths (loops, grids, lists).
 */

/**
 * Creates a handler that calls `fn` with pre-bound arguments.
 * The returned function can be used directly as an event handler.
 *
 * @example
 *   // Instead of: onclick={() => selectCategory("Objects", "Armors")}
 *   // Use:        onclick={bindHandler(selectCategory, "Objects", "Armors")}
 */
export function bindHandler<A extends unknown[]>(
  fn: (...args: A) => void,
  ...args: A
): () => void {
  return () => fn(...args);
}

/**
 * Creates a cached set of handlers keyed by a string.
 * Useful when rendering lists where the same handler is needed per item.
 *
 * @example
 *   const handleSelect = createHandlerMap((id: number) => selectAsset(id));
 *   // In template: onclick={handleSelect(item.id)}
 *   // Same id always returns the same function reference.
 */
export function createHandlerMap<K extends string | number>(
  factory: (key: K) => void
): (key: K) => () => void {
  const cache = new Map<K, () => void>();

  return (key: K) => {
    let handler = cache.get(key);
    if (!handler) {
      handler = () => factory(key);
      cache.set(key, handler);
    }
    return handler;
  };
}
