<script lang="ts">
    // A reflowing sprite-sheet grid (ported from the Python IconSheetWidget).
    // Slices a horizontal strip of `cell`×`cell` icons and lays them out in a
    // grid that wraps to the container width. Click selects a cell; drag moves
    // one cell onto another (emits a reorder). For a non-strip image (cell ===
    // full width) it shows the single image.
    import { onMount } from "svelte";

    interface Props {
        /** Raw PNG bytes of the sheet. */
        bytes: Uint8Array;
        /** Square cell size in source pixels. */
        cell: number;
        /** Selected cell index (-1 = none). */
        selectedIndex?: number;
        /** Zoom factor applied to each cell when drawing. */
        zoom?: number;
        onselect?: (index: number) => void;
        onreorder?: (source: number, target: number) => void;
    }

    let {
        bytes,
        cell,
        selectedIndex = $bindable(-1),
        zoom = 2,
        onselect,
        onreorder,
    }: Props = $props();

    let canvas = $state<HTMLCanvasElement | null>(null);
    let container = $state<HTMLDivElement | null>(null);
    let sheet = $state<HTMLImageElement | null>(null);
    let count = $state(0);
    let columns = $state(1);
    let containerWidth = $state(600);

    let dragSource = $state<number | null>(null);
    let dragTarget = $state<number | null>(null);
    let dragging = $state(false);

    // Drawn cell size on screen.
    let drawCell = $derived(Math.max(8, Math.round(cell * zoom)));

    // (Re)load the image whenever the bytes change. Revoke the old object URL.
    let objectUrl: string | null = null;
    $effect(() => {
        // Reference bytes so the effect re-runs when they change.
        const b = bytes;
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
        }
        // Copy into a fresh ArrayBuffer-backed view so the Blob typing is exact
        // (a plain Uint8Array can be SharedArrayBuffer-backed under strict libs).
        const copy = new Uint8Array(b.length);
        copy.set(b);
        const blob = new Blob([copy.buffer], { type: "image/png" });
        objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            sheet = img;
            count = cell > 0 ? Math.max(1, Math.floor(img.width / cell)) : 1;
            reflowAndDraw();
        };
        img.src = objectUrl;
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;
            }
        };
    });

    // Track container width for reflow.
    onMount(() => {
        if (!container) return;
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) {
                containerWidth = e.contentRect.width;
            }
            reflowAndDraw();
        });
        ro.observe(container);
        return () => ro.disconnect();
    });

    // Redraw on selection / drag / zoom changes.
    $effect(() => {
        // touch deps
        void selectedIndex;
        void dragTarget;
        void dragging;
        void drawCell;
        reflowAndDraw();
    });

    function reflowAndDraw() {
        if (!canvas || !sheet || count === 0) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const cols = Math.max(1, Math.min(count, Math.floor(containerWidth / drawCell) || 1));
        columns = cols;
        const rows = Math.ceil(count / cols);

        canvas.width = cols * drawCell;
        canvas.height = rows * drawCell;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Checkerboard background so transparency is visible.
        const t = 8;
        for (let y = 0; y < canvas.height; y += t) {
            for (let x = 0; x < canvas.width; x += t) {
                ctx.fillStyle = ((x / t + y / t) % 2 === 0) ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.15)";
                ctx.fillRect(x, y, t, t);
            }
        }

        for (let i = 0; i < count; i++) {
            const cx = (i % cols) * drawCell;
            const cy = Math.floor(i / cols) * drawCell;
            ctx.drawImage(sheet, i * cell, 0, cell, cell, cx, cy, drawCell, drawCell);
        }

        // Selection box (red).
        if (selectedIndex >= 0 && selectedIndex < count) {
            const cx = (selectedIndex % cols) * drawCell;
            const cy = Math.floor(selectedIndex / cols) * drawCell;
            ctx.strokeStyle = "#ff4444";
            ctx.lineWidth = 2;
            ctx.strokeRect(cx + 1, cy + 1, drawCell - 2, drawCell - 2);
        }
        // Drag target box (dashed yellow).
        if (dragging && dragTarget !== null && dragTarget < count) {
            const cx = (dragTarget % cols) * drawCell;
            const cy = Math.floor(dragTarget / cols) * drawCell;
            ctx.strokeStyle = "#ffff00";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(cx + 1, cy + 1, drawCell - 2, drawCell - 2);
            ctx.setLineDash([]);
        }
    }

    function indexAt(clientX: number, clientY: number): number | null {
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const c = Math.floor(x / drawCell);
        const r = Math.floor(y / drawCell);
        if (c < 0 || r < 0 || c >= columns) return null;
        const idx = r * columns + c;
        return idx >= 0 && idx < count ? idx : null;
    }

    function onMouseDown(e: MouseEvent) {
        const idx = indexAt(e.clientX, e.clientY);
        if (idx === null) return;
        dragSource = idx;
        dragTarget = idx;
        dragging = false;
        selectedIndex = idx;
        onselect?.(idx);
    }
    function onMouseMove(e: MouseEvent) {
        if (dragSource === null) return;
        const idx = indexAt(e.clientX, e.clientY);
        if (idx === null) return;
        dragging = true;
        dragTarget = idx;
    }
    function onMouseUp(e: MouseEvent) {
        if (dragSource === null) return;
        const target = indexAt(e.clientX, e.clientY);
        const source = dragSource;
        if (dragging && target !== null && target !== source) {
            onreorder?.(source, target);
        }
        dragSource = null;
        dragTarget = null;
        dragging = false;
    }
</script>

<div class="sprite-grid" bind:this={container}>
    <canvas
        bind:this={canvas}
        onmousedown={onMouseDown}
        onmousemove={onMouseMove}
        onmouseup={onMouseUp}
        onmouseleave={onMouseUp}
    ></canvas>
</div>

<style>
    .sprite-grid {
        width: 100%;
        overflow: auto;
        padding: 8px;
    }
    canvas {
        display: block;
        image-rendering: pixelated;
        cursor: pointer;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
    }
</style>
