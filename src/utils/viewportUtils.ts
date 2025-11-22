/**
 * Viewport Utilities
 * 
 * Helper functions for viewport detection and prioritization
 */

/**
 * Check if an element is in the viewport
 */
export function isElementInViewport(element: HTMLElement, threshold = 0): boolean {
  const rect = element.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;

  const verticallyVisible = rect.top < vh * (1 + threshold) && rect.bottom > vh * -threshold;
  const horizontallyVisible = rect.left < vw && rect.right > 0;

  return verticallyVisible && horizontallyVisible;
}

/**
 * Get distance from element to viewport center
 * Lower distance = higher priority
 */
export function getDistanceFromViewportCenter(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;

  const centerX = vw / 2;
  const centerY = vh / 2;

  const elementCenterX = rect.left + rect.width / 2;
  const elementCenterY = rect.top + rect.height / 2;

  const dx = elementCenterX - centerX;
  const dy = elementCenterY - centerY;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if element is in viewport by ID
 */
export function isElementIdInViewport(elementId: string, threshold = 0): boolean {
  const element = document.getElementById(elementId);
  if (!element) return false;
  return isElementInViewport(element, threshold);
}

/**
 * Sort items by viewport priority
 * Items in viewport come first, sorted by distance from center
 */
export function sortByViewportPriority<T extends { id: number }>(
  items: T[],
  getElementId: (item: T) => string
): T[] {
  return items.sort((a, b) => {
    const aElement = document.getElementById(getElementId(a));
    const bElement = document.getElementById(getElementId(b));

    if (!aElement && !bElement) return 0;
    if (!aElement) return 1;
    if (!bElement) return -1;

    const aInViewport = isElementInViewport(aElement);
    const bInViewport = isElementInViewport(bElement);

    // Prioritize items in viewport
    if (aInViewport && !bInViewport) return -1;
    if (!aInViewport && bInViewport) return 1;

    // Both in viewport or both out - sort by distance from center
    if (aInViewport && bInViewport) {
      const aDistance = getDistanceFromViewportCenter(aElement);
      const bDistance = getDistanceFromViewportCenter(bElement);
      return aDistance - bDistance;
    }

    return 0;
  });
}

/**
 * Get all visible element IDs in a container
 */
export function getVisibleElementIds(
  container: HTMLElement,
  selector: string
): string[] {
  const elements = container.querySelectorAll<HTMLElement>(selector);
  const visibleIds: string[] = [];

  elements.forEach(element => {
    if (isElementInViewport(element) && element.id) {
      visibleIds.push(element.id);
    }
  });

  return visibleIds;
}
