import { mount } from 'svelte';
import App from './App.svelte';
import { debugCache } from './spriteCache';
import { performanceMonitor } from './utils/performanceMonitor';

// Expose debug utilities globally for console access
(globalThis as any).debugCache = debugCache;
(globalThis as any).__performanceMonitor = performanceMonitor;

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
