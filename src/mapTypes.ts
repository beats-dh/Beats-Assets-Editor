// Map Types - TypeScript interfaces matching Rust structs

export interface MapInfo {
  version: number;
  width: number;
  height: number;
  description: string;
  tileCount: number;
  townCount: number;
  waypointCount: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface TileData {
  x: number;
  y: number;
  z: number;
  houseId?: number;
  flags: number;
  items: ItemData[];
}

export interface ItemData {
  id: number;
  count?: number;
  actionId?: number;
  uniqueId?: number;
  text?: string;
}

export interface TownData {
  id: number;
  name: string;
  templeX: number;
  templeY: number;
  templeZ: number;
}

export interface WaypointData {
  name: string;
  x: number;
  y: number;
  z: number;
}

export interface MapRegionRequest {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  z: number;
}

export interface ItemRenderFlags {
  id: number;
  isGround: boolean;
  isBorder: boolean;
  isWall: boolean;
  isOnTop: boolean;
  isTopEffect: boolean;
  alwaysOnBottom: boolean;
  alwaysOnTopOrder: number; // 0=ground, 1=border, 2=wall, 3=top
  height: number;
  hasOffset: boolean;
  offsetX: number;
  offsetY: number;
  isStackable: boolean;
  isContainer: boolean;
}

export interface MapViewState {
  centerX: number;
  centerY: number;
  currentZ: number;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
}
