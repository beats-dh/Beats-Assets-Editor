/**
 * Performance Monitoring
 * 
 * Tracks Web Vitals and custom metrics
 */

export interface PerformanceMetrics {
  // Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Custom Metrics
  spriteLoadTime?: number;
  batchLoadTime?: number;
  renderTime?: number;
  cacheHitRate?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private marks = new Map<string, number>();
  private enabled = true;

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.observeWebVitals();
    }
  }

  private observeWebVitals(): void {
    try {
      // Observe LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe FID
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Observe CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Failed to observe Web Vitals:', error);
    }
  }

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    if (!this.enabled) return;
    this.marks.set(name, performance.now());
  }

  /**
   * Measure time since mark and return duration
   */
  measure(name: string): number | null {
    if (!this.enabled) return null;
    
    const startTime = this.marks.get(name);
    if (startTime === undefined) return null;

    const duration = performance.now() - startTime;
    this.marks.delete(name);
    return duration;
  }

  /**
   * Measure and log
   */
  measureAndLog(name: string, label?: string): number | null {
    const duration = this.measure(name);
    if (duration !== null) {
      console.log(`⏱️ ${label || name}: ${duration.toFixed(2)}ms`);
    }
    return duration;
  }

  /**
   * Track sprite load time
   */
  trackSpriteLoad(duration: number): void {
    this.metrics.spriteLoadTime = duration;
  }

  /**
   * Track batch load time
   */
  trackBatchLoad(duration: number): void {
    this.metrics.batchLoadTime = duration;
  }

  /**
   * Track render time
   */
  trackRender(duration: number): void {
    this.metrics.renderTime = duration;
  }

  /**
   * Track cache hit rate
   */
  trackCacheHitRate(hits: number, total: number): void {
    this.metrics.cacheHitRate = total > 0 ? (hits / total) * 100 : 0;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Log all metrics
   */
  logMetrics(): void {
    console.group('📊 Performance Metrics');
    
    if (this.metrics.lcp) {
      console.log(`LCP: ${this.metrics.lcp.toFixed(2)}ms`);
    }
    if (this.metrics.fid) {
      console.log(`FID: ${this.metrics.fid.toFixed(2)}ms`);
    }
    if (this.metrics.cls !== undefined) {
      console.log(`CLS: ${this.metrics.cls.toFixed(4)}`);
    }
    if (this.metrics.spriteLoadTime) {
      console.log(`Sprite Load: ${this.metrics.spriteLoadTime.toFixed(2)}ms`);
    }
    if (this.metrics.batchLoadTime) {
      console.log(`Batch Load: ${this.metrics.batchLoadTime.toFixed(2)}ms`);
    }
    if (this.metrics.renderTime) {
      console.log(`Render: ${this.metrics.renderTime.toFixed(2)}ms`);
    }
    if (this.metrics.cacheHitRate !== undefined) {
      console.log(`Cache Hit Rate: ${this.metrics.cacheHitRate.toFixed(1)}%`);
    }
    
    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = {};
    this.marks.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Expose globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__performanceMonitor = performanceMonitor;
}
