// Map Viewer - OTBM map visualization
// Based on Remere's Map Editor rendering logic

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { getAppearanceSprites } from "./spriteCache";
import type {
  MapInfo,
  TileData,
  TownData,
  WaypointData,
  MapRegionRequest,
  MapViewState,
  ItemData,
  ItemRenderFlags,
} from "./mapTypes";

// ============================================================================
// CONSTANTS
// ============================================================================

const TILE_SIZE = 32;
const DEFAULT_ZOOM = 1.0;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.25;

// ============================================================================
// STATE
// ============================================================================

let mapInfo: MapInfo | null = null;
let viewState: MapViewState = {
  centerX: 0,
  centerY: 0,
  currentZ: 7,
  zoom: DEFAULT_ZOOM,
  viewportWidth: 0,
  viewportHeight: 0,
};

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let tileCache = new Map<string, TileData>();
let itemFlagsCache = new Map<number, ItemRenderFlags>();

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function loadMapFile(path: string): Promise<MapInfo> {
  console.log("Loading map file:", path);
  const info = await invoke<MapInfo>("load_map", { path });

  mapInfo = info;
  tileCache.clear();
  itemFlagsCache.clear();

  // Center on middle of map
  viewState.centerX = Math.floor((info.minX + info.maxX) / 2);
  viewState.centerY = Math.floor((info.minY + info.maxY) / 2);
  viewState.currentZ = 7;
  viewState.zoom = DEFAULT_ZOOM;

  return info;
}

async function getMapRegion(request: MapRegionRequest): Promise<TileData[]> {
  return await invoke<TileData[]>("get_map_region", { request });
}

async function getTileAt(x: number, y: number, z: number): Promise<TileData | null> {
  return await invoke<TileData | null>("get_tile_at", { x, y, z });
}

async function getTowns(): Promise<TownData[]> {
  return await invoke<TownData[]>("get_towns");
}

async function getWaypoints(): Promise<WaypointData[]> {
  return await invoke<WaypointData[]>("get_waypoints");
}

async function getItemRenderFlags(itemId: number): Promise<ItemRenderFlags> {
  if (itemFlagsCache.has(itemId)) {
    return itemFlagsCache.get(itemId)!;
  }

  try {
    const flags = await invoke<ItemRenderFlags>("get_item_render_flags", { itemId });
    itemFlagsCache.set(itemId, flags);
    return flags;
  } catch (error) {
    // Return default flags if item not found
    const defaultFlags: ItemRenderFlags = {
      id: itemId,
      isGround: false,
      isBorder: false,
      isWall: false,
      isOnTop: false,
      isTopEffect: false,
      alwaysOnBottom: false,
      alwaysOnTopOrder: 0,
      height: 0,
      hasOffset: false,
      offsetX: 0,
      offsetY: 0,
      isStackable: false,
      isContainer: false,
    };
    itemFlagsCache.set(itemId, defaultFlags);
    return defaultFlags;
  }
}

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Sort items by render order following RME's logic
 * From RME items.cpp loadFromProtobuf: alwaysOnBottom = (clip || top || bottom)
 * Rendering order:
 * 1. AlwaysOnBottom items (ground=0, border=1, wall=2, top=3)
 * 2. Regular items
 * 3. Top effects
 */
async function sortItemsByRenderOrder(
  items: ItemData[]
): Promise<Array<{ item: ItemData; flags: ItemRenderFlags }>> {
  const itemsWithFlags = await Promise.all(
    items.map(async (item) => ({
      item,
      flags: await getItemRenderFlags(item.id),
    }))
  );

  // Sort following RME's Tile::addItem() logic
  itemsWithFlags.sort((a, b) => {
    const aFlags = a.flags;
    const bFlags = b.flags;

    // Top effects always render last
    if (aFlags.isTopEffect && !bFlags.isTopEffect) return 1;
    if (!aFlags.isTopEffect && bFlags.isTopEffect) return -1;
    if (aFlags.isTopEffect && bFlags.isTopEffect) return 0;

    // AlwaysOnBottom items render first, in order by alwaysOnTopOrder
    if (aFlags.alwaysOnBottom && !bFlags.alwaysOnBottom) return -1;
    if (!aFlags.alwaysOnBottom && bFlags.alwaysOnBottom) return 1;

    if (aFlags.alwaysOnBottom && bFlags.alwaysOnBottom) {
      // Both are alwaysOnBottom - sort by topOrder
      const orderDiff = aFlags.alwaysOnTopOrder - bFlags.alwaysOnTopOrder;
      if (orderDiff !== 0) return orderDiff;

      // Walls (order=2) sort by height
      if (aFlags.alwaysOnTopOrder === 2 && bFlags.alwaysOnTopOrder === 2) {
        return aFlags.height - bFlags.height;
      }
    }

    // Preserve OTBM file order for items with same priority
    return 0;
  });

  return itemsWithFlags;
}

async function renderTile(tile: TileData, screenX: number, screenY: number) {
  if (!ctx) return;

  const sortedItems = await sortItemsByRenderOrder(tile.items);

  for (const { item, flags } of sortedItems) {
    try {
      // Get sprites from appearances.dat
      const sprites = await getAppearanceSprites("Objects", item.id);

      if (sprites && sprites.length > 0) {
        const img = new Image();
        img.src = `data:image/png;base64,${sprites[0]}`;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        // Apply offset if item has one
        let offsetX = 0;
        let offsetY = 0;
        if (flags.hasOffset) {
          offsetX = flags.offsetX;
          offsetY = flags.offsetY;
        }

        ctx.drawImage(
          img,
          screenX + offsetX,
          screenY + offsetY,
          TILE_SIZE,
          TILE_SIZE
        );

        // Draw count for stackable items
        if (flags.isStackable && item.count && item.count > 1) {
          ctx.fillStyle = "white";
          ctx.strokeStyle = "black";
          ctx.lineWidth = 2;
          ctx.font = "10px Arial";
          const text = item.count.toString();
          const textX = screenX + TILE_SIZE - 12;
          const textY = screenY + TILE_SIZE - 4;
          ctx.strokeText(text, textX, textY);
          ctx.fillText(text, textX, textY);
        }
      }
    } catch (error) {
      // Sprite not found - draw placeholder
      ctx.fillStyle = "#FF00FF";
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = "white";
      ctx.font = "8px Arial";
      ctx.fillText(item.id.toString(), screenX + 2, screenY + 10);
    }
  }

  // Draw house ID if present
  if (tile.houseId) {
    ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = "black";
    ctx.font = "10px Arial";
    ctx.fillText(`H:${tile.houseId}`, screenX + 2, screenY + 12);
  }
}

async function renderMap() {
  if (!canvas || !ctx || !mapInfo) return;

  const scaledTileSize = TILE_SIZE * viewState.zoom;

  // Clear canvas
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate visible tile range
  const tilesX = Math.ceil(viewState.viewportWidth / scaledTileSize) + 2;
  const tilesY = Math.ceil(viewState.viewportHeight / scaledTileSize) + 2;

  const startX = Math.floor(viewState.centerX - tilesX / 2);
  const startY = Math.floor(viewState.centerY - tilesY / 2);
  const endX = Math.ceil(viewState.centerX + tilesX / 2);
  const endY = Math.ceil(viewState.centerY + tilesY / 2);

  // Clamp to map bounds
  const minX = Math.max(startX, mapInfo.minX);
  const maxX = Math.min(endX, mapInfo.maxX);
  const minY = Math.max(startY, mapInfo.minY);
  const maxY = Math.min(endY, mapInfo.maxY);

  // Fetch tiles
  const tiles = await getMapRegion({
    minX,
    maxX,
    minY,
    maxY,
    z: viewState.currentZ,
  });

  // Render tiles
  for (const tile of tiles) {
    const screenX =
      (tile.x - viewState.centerX) * scaledTileSize +
      viewState.viewportWidth / 2;
    const screenY =
      (tile.y - viewState.centerY) * scaledTileSize +
      viewState.viewportHeight / 2;

    await renderTile(tile, screenX, screenY);
  }

  // Draw grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  for (let x = minX; x <= maxX; x++) {
    const screenX =
      (x - viewState.centerX) * scaledTileSize + viewState.viewportWidth / 2;
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, canvas.height);
    ctx.stroke();
  }
  for (let y = minY; y <= maxY; y++) {
    const screenY =
      (y - viewState.centerY) * scaledTileSize + viewState.viewportHeight / 2;
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(canvas.width, screenY);
    ctx.stroke();
  }

  // Draw coordinates
  updateCoordinatesDisplay();
}

function updateCoordinatesDisplay() {
  const coordsDiv = document.getElementById("map-coords");
  if (coordsDiv) {
    coordsDiv.textContent = `X: ${viewState.centerX}, Y: ${viewState.centerY}, Z: ${viewState.currentZ} | Zoom: ${(viewState.zoom * 100).toFixed(0)}%`;
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export function initMapViewer() {
  const mapSection = document.getElementById("map-section");
  if (!mapSection) return;

  mapSection.innerHTML = `
    <div class="map-viewer-container">
      <div class="map-controls">
        <button id="map-load-btn" class="btn btn-primary">Load Map (.otbm)</button>
        <div id="map-info" class="map-info" style="display: none;">
          <span id="map-description"></span>
          <span id="map-stats"></span>
        </div>
        <div class="map-navigation">
          <label>Floor (Z):
            <input type="number" id="map-floor-input" min="0" max="15" value="7" />
          </label>
          <button id="map-zoom-in" class="btn">Zoom +</button>
          <button id="map-zoom-out" class="btn">Zoom -</button>
          <button id="map-reset-view" class="btn">Reset View</button>
        </div>
      </div>
      <div class="map-canvas-container">
        <canvas id="map-canvas"></canvas>
        <div id="map-coords" class="map-coords">No map loaded</div>
      </div>
      <div class="map-sidebar">
        <h3>Towns</h3>
        <div id="towns-list" class="list-container"></div>
        <h3>Waypoints</h3>
        <div id="waypoints-list" class="list-container"></div>
      </div>
    </div>
  `;

  setupEventListeners();
  initCanvas();
}

function initCanvas() {
  canvas = document.getElementById("map-canvas") as HTMLCanvasElement;
  if (!canvas) return;

  ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Set canvas size
  const container = canvas.parentElement;
  if (container) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    viewState.viewportWidth = canvas.width;
    viewState.viewportHeight = canvas.height;
  }

  // Handle resize
  window.addEventListener("resize", () => {
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      viewState.viewportWidth = canvas.width;
      viewState.viewportHeight = canvas.height;
      renderMap();
    }
  });
}

function setupEventListeners() {
  const loadBtn = document.getElementById("map-load-btn");
  const floorInput = document.getElementById("map-floor-input") as HTMLInputElement;
  const zoomInBtn = document.getElementById("map-zoom-in");
  const zoomOutBtn = document.getElementById("map-zoom-out");
  const resetViewBtn = document.getElementById("map-reset-view");

  loadBtn?.addEventListener("click", async () => {
    try {
      const file = await open({
        filters: [{ name: "OTBM Map", extensions: ["otbm"] }],
        multiple: false,
      });

      if (file) {
        const info = await loadMapFile(file.path);

        // Update UI
        const mapInfoDiv = document.getElementById("map-info");
        const descDiv = document.getElementById("map-description");
        const statsDiv = document.getElementById("map-stats");

        if (mapInfoDiv && descDiv && statsDiv) {
          mapInfoDiv.style.display = "block";
          descDiv.textContent = info.description || "No description";
          statsDiv.textContent = `${info.tileCount} tiles, ${info.townCount} towns, ${info.waypointCount} waypoints`;
        }

        // Load towns and waypoints
        await loadTownsAndWaypoints();

        // Render map
        await renderMap();
      }
    } catch (error) {
      console.error("Failed to load map:", error);
      alert(`Failed to load map: ${error}`);
    }
  });

  floorInput?.addEventListener("change", () => {
    viewState.currentZ = parseInt(floorInput.value);
    tileCache.clear();
    renderMap();
  });

  zoomInBtn?.addEventListener("click", () => {
    viewState.zoom = Math.min(MAX_ZOOM, viewState.zoom + ZOOM_STEP);
    renderMap();
  });

  zoomOutBtn?.addEventListener("click", () => {
    viewState.zoom = Math.max(MIN_ZOOM, viewState.zoom - ZOOM_STEP);
    renderMap();
  });

  resetViewBtn?.addEventListener("click", () => {
    if (mapInfo) {
      viewState.centerX = Math.floor((mapInfo.minX + mapInfo.maxX) / 2);
      viewState.centerY = Math.floor((mapInfo.minY + mapInfo.maxY) / 2);
      viewState.zoom = DEFAULT_ZOOM;
      renderMap();
    }
  });

  // Pan with arrow keys
  window.addEventListener("keydown", (e) => {
    if (!mapInfo) return;

    const panAmount = 5;
    switch (e.key) {
      case "ArrowUp":
        viewState.centerY -= panAmount;
        e.preventDefault();
        break;
      case "ArrowDown":
        viewState.centerY += panAmount;
        e.preventDefault();
        break;
      case "ArrowLeft":
        viewState.centerX -= panAmount;
        e.preventDefault();
        break;
      case "ArrowRight":
        viewState.centerX += panAmount;
        e.preventDefault();
        break;
      default:
        return;
    }
    renderMap();
  });

  // Pan with mouse drag
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas?.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  canvas?.addEventListener("mousemove", (e) => {
    if (!isDragging || !mapInfo) return;

    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;

    viewState.centerX -= deltaX / (TILE_SIZE * viewState.zoom);
    viewState.centerY -= deltaY / (TILE_SIZE * viewState.zoom);

    lastX = e.clientX;
    lastY = e.clientY;

    renderMap();
  });

  canvas?.addEventListener("mouseup", () => {
    isDragging = false;
  });

  canvas?.addEventListener("mouseleave", () => {
    isDragging = false;
  });

  // Zoom with mouse wheel
  canvas?.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    viewState.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewState.zoom + delta));
    renderMap();
  });
}

async function loadTownsAndWaypoints() {
  const townsList = document.getElementById("towns-list");
  const waypointsList = document.getElementById("waypoints-list");

  if (townsList) {
    const towns = await getTowns();
    townsList.innerHTML = towns
      .map(
        (town) => `
        <div class="list-item" data-x="${town.templeX}" data-y="${town.templeY}" data-z="${town.templeZ}">
          ${town.name} (${town.id})
        </div>
      `
      )
      .join("");

    townsList.querySelectorAll(".list-item").forEach((item) => {
      item.addEventListener("click", () => {
        const x = parseInt(item.getAttribute("data-x") || "0");
        const y = parseInt(item.getAttribute("data-y") || "0");
        const z = parseInt(item.getAttribute("data-z") || "7");
        viewState.centerX = x;
        viewState.centerY = y;
        viewState.currentZ = z;
        (document.getElementById("map-floor-input") as HTMLInputElement).value = z.toString();
        renderMap();
      });
    });
  }

  if (waypointsList) {
    const waypoints = await getWaypoints();
    waypointsList.innerHTML = waypoints
      .map(
        (wp) => `
        <div class="list-item" data-x="${wp.x}" data-y="${wp.y}" data-z="${wp.z}">
          ${wp.name}
        </div>
      `
      )
      .join("");

    waypointsList.querySelectorAll(".list-item").forEach((item) => {
      item.addEventListener("click", () => {
        const x = parseInt(item.getAttribute("data-x") || "0");
        const y = parseInt(item.getAttribute("data-y") || "0");
        const z = parseInt(item.getAttribute("data-z") || "7");
        viewState.centerX = x;
        viewState.centerY = y;
        viewState.currentZ = z;
        (document.getElementById("map-floor-input") as HTMLInputElement).value = z.toString();
        renderMap();
      });
    });
  }
}
