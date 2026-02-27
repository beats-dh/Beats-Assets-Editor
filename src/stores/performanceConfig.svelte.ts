// Performance configuration store with localStorage persistence
const STORAGE_KEY = 'performanceConfig';

interface PerfConfig {
    // Cache limits
    appearanceCacheMax: number;
    chunkSize: number;
    maxPreviewCacheSize: number;

    // Rendering
    initialSpriteRenderCount: number;
    spriteRenderChunk: number;
    animationBatchSize: number;
    maxAutoAnimations: number;

    // Timing
    searchDebounceMs: number;
    idleCallbackTimeout: number;

    // Defaults
    defaultPageSize: number;

    // History
    historyLimit: number;
}

const DEFAULTS: PerfConfig = {
    appearanceCacheMax: 200,
    chunkSize: 100,
    maxPreviewCacheSize: 500,
    initialSpriteRenderCount: 48,
    spriteRenderChunk: 24,
    animationBatchSize: 24,
    maxAutoAnimations: 10_000,
    searchDebounceMs: 300,
    idleCallbackTimeout: 300,
    defaultPageSize: 100,
    historyLimit: 100,
};

function loadFromStorage(): PerfConfig {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULTS };
        const parsed = JSON.parse(raw);
        // Merge with defaults (handles new keys added in future versions)
        return { ...DEFAULTS, ...parsed };
    } catch {
        return { ...DEFAULTS };
    }
}

function createPerfConfig() {
    const config = $state<PerfConfig>(loadFromStorage());

    $effect.root(() => {
        $effect(() => {
            // Persist every reactive change
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config }));
        });
    });

    return config;
}

export const perfConfig = createPerfConfig();
export const PERF_DEFAULTS = DEFAULTS;

export function resetPerfConfig(): void {
    Object.assign(perfConfig, DEFAULTS);
}
