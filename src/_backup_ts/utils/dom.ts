/**
 * Safe DOM query utilities
 * 
 * Provides type-safe DOM element queries with null checks
 */

/**
 * Safely query a single element
 * Throws an error if element is not found
 */
export function querySelector<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T {
  const element = parent.querySelector<T>(selector);
  if (!element) {
    console.error(`Element not found: ${selector}`);
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}

/**
 * Safely query a single element, returns null if not found
 */
export function querySelectorSafe<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T | null {
  return parent.querySelector<T>(selector);
}

/**
 * Query all elements matching selector
 */
export function querySelectorAll<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}

/**
 * Get element by ID
 * Throws an error if element is not found
 */
export function getElementById<T extends HTMLElement = HTMLElement>(
  id: string
): T {
  const element = document.getElementById(id) as T | null;
  if (!element) {
    throw new Error(`Element not found with ID: ${id}`);
  }
  return element;
}

/**
 * Get element by ID, returns null if not found
 */
export function getElementByIdSafe<T extends HTMLElement = HTMLElement>(
  id: string
): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * Check if element exists in DOM
 */
export function elementExists(selector: string, parent: Document | Element = document): boolean {
  return parent.querySelector(selector) !== null;
}

/**
 * Wait for element to appear in DOM
 */
export function waitForElement<T extends Element = Element>(
  selector: string,
  timeout = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector<T>(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector<T>(selector);
      if (element) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);
  });
}

/**
 * Create element with attributes and children
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Partial<HTMLElementTagNameMap[K]> & { class?: string; dataset?: Record<string, string> },
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class' && typeof value === 'string') {
        element.className = value;
      } else if (key === 'dataset' && typeof value === 'object' && value !== null) {
        Object.entries(value as Record<string, string>).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else if (key in element) {
        (element as any)[key] = value;
      }
    });
  }

  if (children) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
  }

  return element;
}

/**
 * Remove all children from an element
 */
export function clearElement(element: Element): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Toggle class on element
 */
export function toggleClass(element: Element, className: string, force?: boolean): void {
  element.classList.toggle(className, force);
}

/**
 * Add event listener with automatic cleanup
 * Returns a function to remove the listener
 */
export function addEventListenerWithCleanup<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): () => void {
  element.addEventListener(type, listener, options);
  return () => element.removeEventListener(type, listener, options);
}

/**
 * Safely query element with fallback
 * Returns element or executes fallback if not found
 */
export function querySelectorWithFallback<T extends Element = Element>(
  selector: string,
  fallback: () => void,
  parent: Document | Element = document
): T | null {
  const element = parent.querySelector<T>(selector);
  if (!element) {
    console.warn(`Element not found: ${selector}, executing fallback`);
    fallback();
    return null;
  }
  return element;
}

/**
 * Safely query element and execute callback if found
 */
export function querySelectorAndDo<T extends Element = Element>(
  selector: string,
  callback: (element: T) => void,
  parent: Document | Element = document
): void {
  const element = parent.querySelector<T>(selector);
  if (element) {
    callback(element);
  } else {
    console.warn(`Element not found: ${selector}, skipping callback`);
  }
}
