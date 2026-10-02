<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { open } from "@tauri-apps/plugin-dialog";
    import { onMount } from "svelte";
    import { COMMANDS } from "../../commands";
    import { assetsState } from "../../stores/assetsState.svelte";
    import { appState } from "../../stores/appState.svelte";
    import { translate } from "../../i18n";

    interface MinimapMarker {
        x: number;
        y: number;
        z: number;
        type: number;
        description: string;
    }
    interface MinimapTile {
        x: number;
        y: number;
        floor: number;
        path: string;
    }

    let tab = $state<"markers" | "map">("markers");
    let statusMessage = $state("");

    // ---- shared: resolve the active client path -----------------------------
    async function clientPath(): Promise<string> {
        if (appState.tibiaPath) return appState.tibiaPath;
        try {
            return await invoke<string>(COMMANDS.GET_TIBIA_BASE_PATH);
        } catch {
            return "";
        }
    }

    // ---- markers ------------------------------------------------------------
    let markers = $state<MinimapMarker[]>([]);
    let markersLoaded = $state(false);
    let markerSearch = $state("");
    let filteredMarkers = $derived(
        markerSearch
            ? markers.filter((m) =>
                  m.description
                      .toLowerCase()
                      .includes(markerSearch.toLowerCase()),
              )
            : markers,
    );

    async function loadMarkersAuto() {
        markersLoaded = false;
        try {
            const base = await clientPath();
            markers = await invoke<MinimapMarker[]>(
                COMMANDS.MINIMAP_LOAD_MARKERS_AUTO,
                { tibiaPath: base },
            );
            statusMessage = translate("minimap.status.markers", {
                count: markers.length,
            });
        } catch (e) {
            statusMessage = String(e);
        } finally {
            markersLoaded = true;
        }
    }

    async function openMarkerFile() {
        const picked = await open({
            title: translate("minimap.dialog.openMarkers"),
            filters: [{ name: "Minimap markers", extensions: ["bin"] }],
        });
        if (!picked) return;
        markersLoaded = false;
        try {
            markers = await invoke<MinimapMarker[]>(
                COMMANDS.MINIMAP_LOAD_MARKERS,
                { path: picked as string },
            );
            statusMessage = translate("minimap.status.markers", {
                count: markers.length,
            });
        } catch (e) {
            statusMessage = String(e);
        } finally {
            markersLoaded = true;
        }
    }

    // ---- map tiles ----------------------------------------------------------
    let tiles = $state<MinimapTile[]>([]);
    let floors = $state<number[]>([]);
    let selectedFloor = $state<number | null>(null);
    let mapCanvas = $state<HTMLCanvasElement | null>(null);
    let mapProgress = $state("");
    let mapToken = 0; // cancels an in-flight render when the floor changes

    // Map source: the OTClient explored minimap (.otmm) is preferred when found;
    // the official client's .bmp.lzma tiles are the alternative.
    type MapSource = "otmm" | "tiles";
    let mapSource = $state<MapSource>("otmm");

    interface OtmmFloorInfo {
        floor: number;
        blocks: number;
        min_x: number;
        min_y: number;
        width: number;
        height: number;
    }
    let otmmPath = $state<string | null>(null);
    let otmmFloors = $state<OtmmFloorInfo[]>([]);
    let otmmFloor = $state<number | null>(null);
    let otmmImg = $state<string | null>(null);
    let otmmLoading = $state(false);

    async function loadOtmm(path: string) {
        otmmLoading = true;
        try {
            otmmPath = path;
            mapSource = "otmm";
            otmmFloors = await invoke<OtmmFloorInfo[]>(
                COMMANDS.MINIMAP_OTMM_INFO,
                { path },
            );
            if (otmmFloors.length > 0) {
                // Default to the most-detailed floor (most blocks).
                const best = otmmFloors.reduce((a, b) =>
                    b.blocks > a.blocks ? b : a,
                );
                await renderOtmmFloor(best.floor);
            }
        } catch (e) {
            statusMessage = String(e);
        } finally {
            otmmLoading = false;
        }
    }

    async function openOtmm() {
        const picked = await open({
            title: translate("minimap.dialog.openOtmm"),
            filters: [{ name: "OTClient minimap", extensions: ["otmm"] }],
        });
        if (picked) await loadOtmm(picked as string);
    }

    async function renderOtmmFloor(floor: number) {
        if (!otmmPath) return;
        otmmFloor = floor;
        otmmLoading = true;
        otmmImg = null;
        try {
            const r = await invoke<{ image_base64: string }>(
                COMMANDS.MINIMAP_RENDER_OTMM,
                { path: otmmPath, floor, maxDim: 4096 },
            );
            otmmImg = `data:image/png;base64,${r.image_base64}`;
        } catch (e) {
            statusMessage = String(e);
        } finally {
            otmmLoading = false;
        }
    }

    async function loadTiles() {
        try {
            const base = await clientPath();
            tiles = await invoke<MinimapTile[]>(COMMANDS.MINIMAP_LIST_TILES, {
                tibiaPath: base,
            });
            floors = [...new Set(tiles.map((t) => t.floor))].sort(
                (a, b) => a - b,
            );
            if (floors.length > 0 && selectedFloor === null) {
                selectFloor(floors[0]);
            }
        } catch (e) {
            statusMessage = String(e);
        }
    }

    /** Smallest positive step between sorted unique values (tile grid spacing). */
    function gridStep(values: number[]): number {
        const uniq = [...new Set(values)].sort((a, b) => a - b);
        let step = 0;
        for (let i = 1; i < uniq.length; i++) {
            const d = uniq[i] - uniq[i - 1];
            if (d > 0 && (step === 0 || d < step)) step = d;
        }
        return step || 1;
    }

    const MAX_CANVAS = 8192; // browser-safe upper bound per dimension

    async function selectFloor(floor: number) {
        selectedFloor = floor;
        const token = ++mapToken;
        const floorTiles = tiles.filter((t) => t.floor === floor);
        if (floorTiles.length === 0 || !mapCanvas) return;

        const minX = Math.min(...floorTiles.map((t) => t.x));
        const minY = Math.min(...floorTiles.map((t) => t.y));
        const maxX = Math.max(...floorTiles.map((t) => t.x));
        const maxY = Math.max(...floorTiles.map((t) => t.y));
        const stepX = gridStep(floorTiles.map((t) => t.x));
        const stepY = gridStep(floorTiles.map((t) => t.y));

        // Decode one tile to learn the tile pixel size.
        const firstImg = await decodeTile(floorTiles[0].path);
        if (token !== mapToken || !firstImg) return;
        const tw = firstImg.width;
        const th = firstImg.height;

        const cols = (maxX - minX) / stepX + 1;
        const rows = (maxY - minY) / stepY + 1;
        const fullW = cols * tw;
        const fullH = rows * th;
        // Downscale so the whole floor fits a safe canvas.
        const scale = Math.min(1, MAX_CANVAS / fullW, MAX_CANVAS / fullH);

        const canvas = mapCanvas;
        canvas.width = Math.max(1, Math.round(fullW * scale));
        canvas.height = Math.max(1, Math.round(fullH * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const place = (img: HTMLImageElement | ImageBitmap, t: MinimapTile) => {
            const cx = ((t.x - minX) / stepX) * tw * scale;
            const cy = ((t.y - minY) / stepY) * th * scale;
            ctx.drawImage(img, cx, cy, tw * scale, th * scale);
        };
        place(firstImg, floorTiles[0]);

        // Progressive decode in small concurrent batches; yields keep the UI live.
        const rest = floorTiles.slice(1);
        const BATCH = 8;
        let done = 1;
        for (let i = 0; i < rest.length; i += BATCH) {
            if (token !== mapToken) return; // floor changed — abort
            const slice = rest.slice(i, i + BATCH);
            const imgs = await Promise.all(slice.map((t) => decodeTile(t.path)));
            if (token !== mapToken) return;
            imgs.forEach((img, k) => {
                if (img) place(img, slice[k]);
            });
            done += slice.length;
            mapProgress = translate("minimap.status.rendering", {
                done,
                total: floorTiles.length,
            });
        }
        mapProgress = translate("minimap.status.tiles", {
            count: floorTiles.length,
        });
    }

    async function decodeTile(
        path: string,
    ): Promise<HTMLImageElement | null> {
        try {
            const bytes = await invoke<number[]>(COMMANDS.MINIMAP_GET_TILE, {
                path,
            });
            const blob = new Blob([new Uint8Array(bytes)], {
                type: "image/bmp",
            });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error("tile decode"));
                img.src = url;
            });
            URL.revokeObjectURL(url);
            return img;
        } catch {
            return null;
        }
    }

    function switchSource(src: MapSource) {
        mapSource = src;
        if (src === "tiles" && tiles.length === 0) loadTiles();
    }

    onMount(() => {
        loadMarkersAuto();
    });

    function goBack() {
        assetsState.viewMode = "categories";
    }
</script>

<div class="minimap-browser">
    <header class="mm-toolbar">
        <button class="mm-btn" onclick={goBack}>← {translate("rcc.back")}</button
        >
        <div class="mm-tabs">
            <button
                class="mm-tab"
                class:active={tab === "markers"}
                onclick={() => (tab = "markers")}
                >📍 {translate("minimap.tab.markers")}</button
            >
            <button
                class="mm-tab"
                class:active={tab === "map"}
                onclick={() => (tab = "map")}>🗺️ {translate("minimap.tab.map")}</button
            >
        </div>
        {#if statusMessage}<span class="mm-status">{statusMessage}</span>{/if}
    </header>

    {#if tab === "markers"}
        <div class="mm-controls">
            <input
                class="mm-search"
                type="text"
                bind:value={markerSearch}
                placeholder={translate("minimap.search.markers")}
            />
            <button class="mm-btn" onclick={loadMarkersAuto}
                >{translate("minimap.btn.reload")}</button
            >
            <button class="mm-btn" onclick={openMarkerFile}
                >{translate("minimap.btn.openFile")}</button
            >
            <span class="mm-count">{filteredMarkers.length}</span>
        </div>
        <div class="mm-content">
            {#if !markersLoaded}
                <p class="mm-empty">…</p>
            {:else if markers.length === 0}
                <p class="mm-empty">{translate("minimap.empty.markers")}</p>
            {:else}
                <table class="mm-table">
                    <thead>
                        <tr>
                            <th>X</th><th>Y</th><th>Z</th>
                            <th>{translate("minimap.col.type")}</th>
                            <th>{translate("minimap.col.description")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredMarkers as m}
                            <tr>
                                <td>{m.x}</td><td>{m.y}</td><td>{m.z}</td>
                                <td>{m.type}</td>
                                <td>{m.description}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    {:else}
        <div class="mm-controls">
            <div class="mm-tabs">
                <button
                    class="mm-tab"
                    class:active={mapSource === "otmm"}
                    onclick={() => switchSource("otmm")}
                    >{translate("minimap.src.otmm")}</button
                >
                <button
                    class="mm-tab"
                    class:active={mapSource === "tiles"}
                    onclick={() => switchSource("tiles")}
                    >{translate("minimap.src.tiles")}</button
                >
            </div>
            {#if mapSource === "otmm"}
                <button class="mm-btn" onclick={openOtmm}
                    >{translate("minimap.btn.openOtmm")}</button
                >
                {#each otmmFloors as f}
                    <button
                        class="mm-floor"
                        class:active={otmmFloor === f.floor}
                        onclick={() => renderOtmmFloor(f.floor)}
                        title={`${f.blocks} blocks`}
                    >
                        {translate("minimap.floor")}
                        {f.floor}
                    </button>
                {/each}
                {#if otmmLoading}<span class="mm-count"
                        >{translate("minimap.status.renderingFloor")}</span
                    >{/if}
            {:else}
                {#each floors as f}
                    <button
                        class="mm-floor"
                        class:active={selectedFloor === f}
                        onclick={() => selectFloor(f)}
                    >
                        {translate("minimap.floor")}
                        {f}
                    </button>
                {/each}
                {#if mapProgress}<span class="mm-count">{mapProgress}</span>{/if}
            {/if}
        </div>
        <div class="mm-map-scroll">
            {#if mapSource === "otmm"}
                {#if otmmPath === null}
                    <p class="mm-empty">{translate("minimap.empty.otmm")}</p>
                {:else if otmmImg}
                    <img src={otmmImg} alt="minimap" class="mm-canvas" />
                {/if}
            {:else}
                {#if floors.length === 0}
                    <p class="mm-empty">{translate("minimap.empty.tiles")}</p>
                {/if}
                <canvas bind:this={mapCanvas} class="mm-canvas"></canvas>
            {/if}
        </div>
    {/if}
</div>

<style>
    .minimap-browser {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--bg-primary);
        color: var(--text-primary);
    }
    .mm-toolbar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border-color);
    }
    .mm-tabs {
        display: flex;
        gap: 0.25rem;
    }
    .mm-tab,
    .mm-btn,
    .mm-floor {
        background: var(--gradient-card);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        border-radius: var(--radius-md);
        padding: 0.4rem 0.8rem;
        cursor: pointer;
        font-size: 0.85rem;
    }
    .mm-tab.active,
    .mm-floor.active {
        border-color: var(--primary-accent);
        background: var(--primary-accent);
        color: #fff;
    }
    .mm-status,
    .mm-count {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-left: auto;
    }
    .mm-controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1rem;
        border-bottom: 1px solid var(--border-color);
    }
    .mm-search {
        flex: 1;
        min-width: 180px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        border-radius: var(--radius-md);
        padding: 0.4rem 0.6rem;
    }
    .mm-content {
        flex: 1;
        overflow: auto;
        padding: 1rem;
    }
    .mm-empty {
        color: var(--text-muted);
        text-align: center;
        margin-top: 2rem;
    }
    .mm-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
    }
    .mm-table th,
    .mm-table td {
        text-align: left;
        padding: 0.35rem 0.6rem;
        border-bottom: 1px solid var(--border-color);
    }
    .mm-table th {
        color: var(--text-secondary);
        position: sticky;
        top: 0;
        background: var(--bg-primary);
    }
    .mm-map-scroll {
        flex: 1;
        overflow: auto;
        padding: 1rem;
        background: #000;
    }
    .mm-canvas {
        image-rendering: pixelated;
        display: block;
    }
</style>
