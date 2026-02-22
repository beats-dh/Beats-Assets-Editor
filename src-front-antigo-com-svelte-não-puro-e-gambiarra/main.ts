import { mount } from 'svelte';
import App from './App.svelte';
import { debugCache } from './spriteCache';
import { performanceMonitor } from './utils/performanceMonitor';

// Expose debugCache globally for console access
(window as any).debugCache = debugCache;
(window as any).__performanceMonitor = performanceMonitor;

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
