/**
 * Virtual Scrolling Implementation
 * 
 * Renders only visible items in the viewport for optimal performance
 * with large datasets (>500 items)
 */

export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number; // Number of items to render outside viewport
}

export interface VirtualScrollState {
  scrollTop: number;
  visibleStart: number;
  visibleEnd: number;
  totalHeight: number;
}

export class VirtualScroll<T> {
  private config: VirtualScrollConfig;
  private items: T[] = [];
  private state: VirtualScrollState;
  private container: HTMLElement;
  private viewport: HTMLElement;
  private onRenderItem: (item: T, index: number) => HTMLElement;
  private renderedElements = new Map<number, HTMLElement>();

  constructor(
    container: HTMLElement,
    config: VirtualScrollConfig,
    onRenderItem: (item: T, index: number) => HTMLElement
  ) {
    this.container = container;
    this.config = config;
    this.onRenderItem = onRenderItem;
    
    // Create viewport
    this.viewport = document.createElement('div');
    this.viewport.style.position = 'relative';
    this.viewport.style.overflow = 'hidden';
    this.container.appendChild(this.viewport);

    this.state = {
      scrollTop: 0,
      visibleStart: 0,
      visibleEnd: 0,
      totalHeight: 0,
    };

    this.setupScrollListener();
  }

  private setupScrollListener(): void {
    this.container.addEventListener('scroll', () => {
      this.state.scrollTop = this.container.scrollTop;
      this.updateVisibleRange();
      this.render();
    });
  }

  private updateVisibleRange(): void {
    const { itemHeight, containerHeight, overscan } = this.config;
    const { scrollTop } = this.state;

    const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const visibleEnd = Math.min(this.items.length, visibleStart + visibleCount);

    this.state.visibleStart = visibleStart;
    this.state.visibleEnd = visibleEnd;
  }

  setItems(items: T[]): void {
    this.items = items;
    this.state.totalHeight = items.length * this.config.itemHeight;
    this.viewport.style.height = `${this.state.totalHeight}px`;
    this.updateVisibleRange();
    this.render();
  }

  appendItems(items: T[]): void {
    this.items.push(...items);
    this.state.totalHeight = this.items.length * this.config.itemHeight;
    this.viewport.style.height = `${this.state.totalHeight}px`;
    this.updateVisibleRange();
    this.render();
  }

  private render(): void {
    const { visibleStart, visibleEnd } = this.state;
    const { itemHeight } = this.config;

    // Remove elements outside visible range
    for (const [index, element] of this.renderedElements.entries()) {
      if (index < visibleStart || index >= visibleEnd) {
        element.remove();
        this.renderedElements.delete(index);
      }
    }

    // Render visible items
    for (let i = visibleStart; i < visibleEnd; i++) {
      if (!this.renderedElements.has(i)) {
        const item = this.items[i];
        const element = this.onRenderItem(item, i);
        element.style.position = 'absolute';
        element.style.top = `${i * itemHeight}px`;
        element.style.left = '0';
        element.style.right = '0';
        element.style.height = `${itemHeight}px`;
        this.viewport.appendChild(element);
        this.renderedElements.set(i, element);
      }
    }
  }

  scrollToIndex(index: number): void {
    const { itemHeight } = this.config;
    const scrollTop = index * itemHeight;
    this.container.scrollTop = scrollTop;
  }

  clear(): void {
    this.items = [];
    this.renderedElements.clear();
    this.viewport.innerHTML = '';
    this.state.totalHeight = 0;
    this.viewport.style.height = '0px';
  }

  getVisibleRange(): { start: number; end: number } {
    return {
      start: this.state.visibleStart,
      end: this.state.visibleEnd,
    };
  }

  getTotalItems(): number {
    return this.items.length;
  }

  destroy(): void {
    this.clear();
    this.viewport.remove();
  }
}

/**
 * Check if virtual scrolling should be enabled based on item count
 */
export function shouldUseVirtualScroll(itemCount: number): boolean {
  return itemCount > 500; // Enable for large datasets
}
