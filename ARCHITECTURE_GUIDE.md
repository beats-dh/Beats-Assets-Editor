# 🏗️ Tibia Assets Editor - Architecture Guide

> **Educational documentation for understanding the internal architecture of the Tibia Assets Editor**  
> A modern desktop application built with Tauri, Rust, and TypeScript

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Layers](#architecture-layers)
5. [Data Flow & Execution Cycle](#data-flow--execution-cycle)
6. [Feature-Based Organization](#feature-based-organization)
7. [IPC Communication Pattern](#ipc-communication-pattern)
8. [State Management](#state-management)
9. [Performance Optimizations](#performance-optimizations)
10. [Design Patterns](#design-patterns)
11. [Glossary](#glossary)

---

## Overview

The **Tibia Assets Editor** is a desktop application for editing game assets from the MMORPG Tibia. It allows users to:
- View and edit appearances (objects, outfits, effects, missiles)
- Manage sprites and animations
- Edit sounds and music
- Modify monster definitions
- Import/export assets

The application follows a **hybrid architecture** combining:
- **Rust backend** for high-performance file parsing, data processing, and caching
- **TypeScript frontend** for rich UI interactions and asset visualization
- **Tauri framework** for native desktop integration and IPC communication

---

## Technology Stack

### Backend (Rust)
- **Tauri 2.x** - Desktop application framework
- **Protocol Buffers (prost)** - Binary data serialization
- **LZMA/XZ2** - Compression/decompression
- **DashMap** - Lock-free concurrent hash maps
- **parking_lot** - High-performance synchronization primitives (3x faster than std)
- **Rayon** - Data parallelism
- **AHash** - Fast hashing algorithm
- **Tokio** - Async runtime

### Frontend (TypeScript)
- **Vite** - Build tool and dev server
- **TypeScript 5.6** - Type-safe JavaScript
- **Vanilla JS** - No framework dependencies (performance-focused)
- **Web Workers** - Background processing for animations and image decoding
- **CSS Modules** - Modular styling

### Data Formats
- **Protocol Buffers** - Appearances and sounds data
- **JSON** - Sprite catalogs and configuration
- **Lua** - Monster definitions
- **PNG/JPEG/BMP** - Image formats

---

## Project Structure

```
Beats-Assets-Editor/
├── src/                          # Frontend (TypeScript)
│   ├── features/                 # Feature-specific UI modules
│   │   ├── assetGrid/           # Asset grid layout
│   │   ├── infiniteScroll/      # Infinite scroll implementation
│   │   ├── previewAnimation/    # Animation preview system
│   │   └── layout/              # Layout components
│   ├── styles/                   # Modular CSS
│   ├── utils/                    # Utility functions
│   ├── workers/                  # Web Workers
│   │   ├── animationWorker.ts   # Animation frame generation
│   │   ├── imageBitmapWorker.ts # Image decoding
│   │   └── outfitComposeWorker.ts # Outfit composition
│   ├── main.ts                   # Application entry point
│   ├── types.ts                  # TypeScript type definitions
│   └── [feature modules].ts      # Feature implementations
│
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   ├── core/                 # Core utilities
│   │   │   ├── lzma/            # LZMA decompression
│   │   │   └── protobuf/        # Protobuf code generation
│   │   ├── features/             # Feature modules
│   │   │   ├── appearances/     # Appearances management
│   │   │   │   ├── commands/    # Tauri commands
│   │   │   │   ├── parsers/     # File parsers
│   │   │   │   └── types.rs     # Type definitions
│   │   │   ├── sprites/         # Sprite management
│   │   │   ├── sounds/          # Sound management
│   │   │   ├── monsters/        # Monster definitions
│   │   │   └── settings/        # Application settings
│   │   ├── state.rs              # Global application state
│   │   ├── lib.rs                # Library entry point
│   │   └── main.rs               # Application entry point
│   ├── protobuf/                 # Protocol Buffer definitions
│   │   ├── appearances.proto    # Appearances schema
│   │   └── sounds.proto         # Sounds schema
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
│
├── dist/                         # Built frontend (generated)
├── node_modules/                 # Node dependencies
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite configuration
```

---

## Architecture Layers

The application is organized into **4 distinct layers**:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                        │
│  (TypeScript/Vite - UI, Event Handling, State)          │
│  - Asset Grid & Infinite Scroll                          │
│  - Animation Preview                                     │
│  - Asset Details Editor                                  │
│  - Import/Export UI                                      │
└─────────────────────────────────────────────────────────┘
                          ↕ IPC (Tauri Commands)
┌─────────────────────────────────────────────────────────┐
│                      IPC LAYER                           │
│  (Tauri Commands - Bidirectional Communication)         │
│  - Command Registration                                  │
│  - Type Serialization/Deserialization                    │
│  - Error Handling                                        │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                         │
│  (Rust - Business Logic, Caching, Processing)           │
│  - File Parsing (Protobuf, Lua, JSON)                   │
│  - Data Transformation                                   │
│  - Sprite Caching (DashMap)                              │
│  - State Management (parking_lot locks)                  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                     DATA LAYER                           │
│  (File System, Protocol Buffers, LZMA)                  │
│  - appearances.dat (Protobuf)                            │
│  - catalog-content.json (Sprite catalog)                 │
│  - sounds.dat (Protobuf)                                 │
│  - monsters/*.lua (Lua scripts)                          │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### 1. Frontend Layer (TypeScript)
- **Rendering**: Display assets in grid, details panel, and preview
- **User Input**: Handle clicks, keyboard shortcuts, form inputs
- **State Management**: Track UI state (selected asset, filters, pagination)
- **IPC Calls**: Invoke backend commands via Tauri
- **Caching**: Cache decoded sprites and preview images (browser-side)

#### 2. IPC Layer (Tauri)
- **Command Registration**: Register Rust functions as callable commands
- **Serialization**: Convert Rust types ↔ JSON for frontend
- **Error Propagation**: Transform Rust errors into frontend-friendly messages
- **Type Safety**: Ensure type consistency between Rust and TypeScript

#### 3. Backend Layer (Rust)
- **File Parsing**: Parse binary formats (Protobuf, LZMA-compressed data)
- **Data Processing**: Transform raw data into usable structures
- **Caching**: Cache parsed data and sprites in memory (DashMap)
- **Indexing**: Build O(1) lookup indexes for fast queries
- **Validation**: Validate data integrity and handle errors

#### 4. Data Layer (File System)
- **File I/O**: Read/write files from disk
- **Compression**: Decompress LZMA-compressed sprites
- **Serialization**: Encode/decode Protocol Buffer messages
- **Persistence**: Save modified data back to disk

---

## Data Flow & Execution Cycle

### Application Startup Flow

```
1. User launches application
   ↓
2. Tauri initializes Rust backend
   ↓
3. AppState is created (empty caches, no data loaded)
   ↓
4. Frontend loads (Vite serves index.html)
   ↓
5. main.ts executes DOMContentLoaded
   ↓
6. Launcher UI is displayed
   ↓
7. User selects Tibia directory
   ↓
8. Frontend calls: invoke("load_appearances_file", { path })
   ↓
9. Backend parses appearances.dat (Protobuf)
   ↓
10. Backend builds ID indexes (O(1) lookups)
   ↓
11. Backend stores data in AppState
   ↓
12. Backend returns stats to frontend
   ↓
13. Frontend displays main UI with asset grid
   ↓
14. User interacts with assets (view, edit, save)
```

### Asset Loading Flow (Example: Loading Objects)

```
┌─────────────┐
│  Frontend   │
│  (main.ts)  │
└──────┬──────┘
       │ 1. User clicks "Objects" category
       ↓
┌──────────────────────────────────────────────────────┐
│ invoke("list_appearances_by_category", {            │
│   category: "object",                                │
│   offset: 0,                                         │
│   limit: 100                                         │
│ })                                                   │
└──────┬───────────────────────────────────────────────┘
       │ IPC Call
       ↓
┌─────────────────────────────────────────────────────┐
│  Backend (Rust)                                     │
│  features/appearances/commands/query.rs             │
│                                                     │
│  1. Lock AppState.appearances (read lock)           │
│  2. Filter objects by category                      │
│  3. Apply pagination (offset, limit)                │
│  4. Map to AppearanceItem (ID, name, flags)         │
│  5. Return Vec<AppearanceItem>                      │
└──────┬──────────────────────────────────────────────┘
       │ IPC Response (JSON)
       ↓
┌─────────────────────────────────────────────────────┐
│  Frontend (TypeScript)                              │
│  assetUI.ts                                         │
│                                                     │
│  1. Receive appearance list                         │
│  2. For each appearance:                            │
│     - Create grid item element                      │
│     - Load preview sprite (invoke get_sprite)       │
│     - Render in grid                                │
│  3. Setup infinite scroll for more items            │
└─────────────────────────────────────────────────────┘
```

### Sprite Loading Flow

```
Frontend requests sprite
   ↓
invoke("get_sprite_by_id", { id: 123 })
   ↓
Backend checks sprite_cache (DashMap)
   ├─ Cache HIT → Return cached PNG bytes
   └─ Cache MISS ↓
      1. Load sprite from catalog-content.json
      2. Decompress LZMA data
      3. Decode sprite pixels
      4. Encode as PNG
      5. Store in cache (Arc<Vec<u8>>)
      6. Return PNG bytes
   ↓
Frontend receives base64-encoded PNG
   ↓
Create <img> element with data URL
   ↓
Display in UI
```

### Asset Editing Flow

```
User edits asset property (e.g., name)
   ↓
Frontend calls: invoke("update_appearance_name", {
  category: "object",
  id: 100,
  name: "New Name"
})
   ↓
Backend:
  1. Lock AppState.appearances (write lock)
  2. Find appearance by ID using index
  3. Update name field
  4. Unlock
  5. Return success
   ↓
Frontend updates UI to reflect change
   ↓
User clicks "Save"
   ↓
Frontend calls: invoke("save_appearances_file", { path })
   ↓
Backend:
  1. Lock AppState.appearances (read lock)
  2. Serialize to Protocol Buffer format
  3. Write to disk
  4. Unlock
  5. Return success
   ↓
Frontend shows success message
```

---

## Feature-Based Organization

The codebase follows a **feature-based architecture** where each major feature is self-contained:

### Backend Features (Rust)

Each feature module follows this structure:

```
features/
└── <feature_name>/
    ├── mod.rs           # Module exports
    ├── types.rs         # Feature-specific types
    ├── commands/        # Tauri commands (IPC endpoints)
    │   ├── mod.rs
    │   ├── io.rs        # File I/O operations
    │   ├── query.rs     # Data queries
    │   └── update.rs    # Data mutations
    └── parsers/         # File format parsers
        ├── mod.rs
        └── <parser>.rs  # Specific parser implementation
```

**Example: Appearances Feature**

```rust
// features/appearances/mod.rs
pub mod commands;  // Tauri commands
pub mod parsers;   // Protobuf parser
pub mod types;     // Type definitions

// features/appearances/commands/query.rs
#[tauri::command]
pub async fn list_appearances_by_category(
    category: String,
    offset: usize,
    limit: usize,
    state: State<'_, AppState>
) -> Result<Vec<AppearanceItem>, String> {
    // Implementation
}
```

### Frontend Features (TypeScript)

Frontend features are organized by UI concern:

```
src/
├── features/
│   ├── assetGrid/              # Asset grid display
│   ├── infiniteScroll/         # Infinite scroll behavior
│   ├── previewAnimation/       # Animation preview
│   └── layout/                 # Layout components
├── assetUI.ts                  # Asset browser UI
├── assetDetails.ts             # Asset details panel
├── assetSelection.ts           # Asset selection logic
└── assetSave.ts                # Save operations
```

---

## IPC Communication Pattern

### Command Pattern

Tauri uses a **command pattern** for IPC:

1. **Backend**: Define command with `#[tauri::command]` macro
2. **Registration**: Register command in `lib.rs`
3. **Frontend**: Call command with `invoke()`

**Example:**

```rust
// Backend (Rust)
#[tauri::command]
pub async fn get_appearance_details(
    category: String,
    id: u32,
    state: State<'_, AppState>
) -> Result<CompleteAppearanceItem, String> {
    // Implementation
}

// Registration in lib.rs
.invoke_handler(tauri::generate_handler![
    get_appearance_details,
    // ... other commands
])
```

```typescript
// Frontend (TypeScript)
import { invoke } from "@tauri-apps/api/core";

const details = await invoke<CompleteAppearanceItem>(
  "get_appearance_details",
  { category: "object", id: 100 }
);
```

### Type Safety

- **Rust**: Uses `serde` for serialization
- **TypeScript**: Uses interface definitions in `types.ts`
- **Contract**: Both sides must agree on JSON structure

**Example Type Mapping:**

```rust
// Rust
#[derive(Serialize)]
pub struct AppearanceItem {
    pub id: u32,
    pub name: Option<String>,
    pub description: Option<String>,
}
```

```typescript
// TypeScript
export interface AppearanceItem {
  id: number;
  name?: string;
  description?: string;
}
```

---

## State Management

### Backend State (Rust)

The backend uses a **centralized state** pattern with `AppState`:

```rust
pub struct AppState {
    // Core data (parking_lot locks - 3x faster)
    pub appearances: RwLock<Option<Appearances>>,
    pub sprite_loader: RwLock<Option<SpriteLoader>>,
    pub tibia_path: Mutex<Option<PathBuf>>,

    // Lock-free concurrent caches (DashMap)
    pub sprite_cache: DashMap<String, Arc<Vec<Vec<u8>>>>,
    pub preview_cache: DashMap<String, Arc<Vec<u8>>>,

    // O(1) lookup indexes
    pub object_index: DashMap<u32, usize>,
    pub outfit_index: DashMap<u32, usize>,
    pub effect_index: DashMap<u32, usize>,
    pub missile_index: DashMap<u32, usize>,

    // Search cache
    pub search_cache: DashMap<String, Arc<Vec<u32>>>,

    // Clipboard
    pub flags_clipboard: Mutex<Option<CompleteFlags>>,
}
```

**Key Design Decisions:**

1. **parking_lot locks**: 3x faster than `std::sync` locks
2. **DashMap**: Lock-free concurrent hash map (no mutex needed)
3. **Arc**: Shared ownership for cached data (avoid clones)
4. **Indexes**: O(1) lookups instead of O(n) linear scans

### Frontend State (TypeScript)

The frontend uses **distributed state** with multiple modules:

- **modalState.ts**: Modal dialog state
- **spriteCache.ts**: Sprite caching
- **navigation.ts**: Current view state
- **localStorage**: Persistent settings (theme, language, paths)

**Example:**

```typescript
// spriteCache.ts
const spriteCache = new Map<string, string>(); // ID -> data URL

export function getCachedSprite(id: number): string | undefined {
  return spriteCache.get(String(id));
}

export function cacheSprite(id: number, dataUrl: string): void {
  spriteCache.set(String(id), dataUrl);
}
```

---

## Performance Optimizations

The application is heavily optimized for performance:

### Backend Optimizations

1. **Lock-Free Caching (DashMap)**
   - No mutex contention for sprite cache access
   - Concurrent reads and writes without blocking

2. **parking_lot Locks**
   - 3x faster than standard library locks
   - Smaller memory footprint

3. **O(1) Lookup Indexes**
   - Build hash maps: `ID → Vec index`
   - Avoid O(n) linear scans through appearance lists

4. **Arc for Shared Data**
   - Avoid expensive clones of large data structures
   - Share cached sprites across threads

5. **Rayon for Parallelism**
   - Parallel iteration over large collections
   - Utilize all CPU cores

6. **AHash for Fast Hashing**
   - Faster than default SipHash
   - Used in DashMap and custom hash maps

7. **Batch Operations**
   - `get_appearance_sprites_batch`: Load multiple sprites in one call
   - Reduces IPC overhead

### Frontend Optimizations

1. **Infinite Scroll**
   - Only render visible assets
   - Lazy-load sprites as user scrolls

2. **Web Workers**
   - Offload animation frame generation to background thread
   - Decode images without blocking UI

3. **Sprite Caching**
   - Cache decoded sprites in memory
   - Avoid redundant decoding

4. **Debouncing**
   - Debounce search input to reduce backend calls

5. **Virtual Scrolling**
   - Render only visible grid items
   - Recycle DOM elements

---

## Design Patterns

### 1. Command Pattern (IPC)
- **Purpose**: Encapsulate backend operations as commands
- **Implementation**: Tauri commands with `#[tauri::command]`
- **Benefit**: Clean separation between frontend and backend

### 2. Repository Pattern (Data Access)
- **Purpose**: Abstract data access logic
- **Implementation**: Parser modules handle file I/O
- **Benefit**: Easy to swap data sources (e.g., database vs files)

### 3. Cache-Aside Pattern
- **Purpose**: Improve performance by caching expensive operations
- **Implementation**: Check cache → if miss, compute → store in cache
- **Benefit**: Reduces redundant parsing and sprite decoding

### 4. State Pattern (Application State)
- **Purpose**: Manage application state centrally
- **Implementation**: `AppState` struct with locks and caches
- **Benefit**: Single source of truth for backend data

### 5. Observer Pattern (Event Listeners)
- **Purpose**: React to user interactions
- **Implementation**: DOM event listeners in frontend
- **Benefit**: Decoupled UI components

### 6. Factory Pattern (Sprite Loading)
- **Purpose**: Create sprites from different sources
- **Implementation**: `SpriteLoader` with multiple load methods
- **Benefit**: Flexible sprite loading strategies

### 7. Singleton Pattern (Global State)
- **Purpose**: Ensure single instance of application state
- **Implementation**: Tauri's `.manage()` for state injection
- **Benefit**: Consistent state across all commands

---

## Glossary

### General Terms

- **Tauri**: Framework for building desktop applications with web technologies and Rust
- **IPC (Inter-Process Communication)**: Communication between frontend (web) and backend (Rust)
- **Protocol Buffers (Protobuf)**: Binary serialization format developed by Google
- **LZMA**: Lossless data compression algorithm
- **DashMap**: Lock-free concurrent hash map for Rust
- **parking_lot**: High-performance synchronization primitives for Rust

### Tibia-Specific Terms

- **Appearance**: Visual representation of game objects, outfits, effects, or missiles
- **Sprite**: Individual image frame used to compose appearances
- **Frame Group**: Collection of sprites for different animation states (idle, moving)
- **Pattern**: Variations of a sprite (e.g., different directions, colors)
- **Layer**: Stacked sprites that compose a single appearance
- **Phase**: Animation frame in a sequence
- **Special Meaning IDs**: Predefined IDs for special items (gold coin, platinum coin, etc.)

### Architecture Terms

- **Feature Module**: Self-contained module for a specific feature (appearances, sprites, sounds)
- **Command**: Backend function callable from frontend via IPC
- **Parser**: Module responsible for reading and decoding file formats
- **State**: Application data stored in memory
- **Cache**: Temporary storage for expensive-to-compute data
- **Index**: Hash map for O(1) lookups by ID

### Performance Terms

- **O(1) Lookup**: Constant-time lookup (hash map)
- **O(n) Scan**: Linear-time scan (iterate through list)
- **Lock-Free**: Data structure that doesn't require mutex locks
- **Arc (Atomic Reference Counting)**: Shared ownership pointer for thread-safe data sharing
- **Batch Operation**: Processing multiple items in a single operation

---

## Next Steps

To dive deeper into specific areas:

1. **IPC Sync**: See `IPC_SYNC_REPORT.md` for command/type consistency analysis
2. **Performance**: See `PERFORMANCE_REPORT.md` for bottleneck analysis
3. **Code Quality**: See `CODE_SMELLS_REPORT.md` for code improvement suggestions
4. **Data Integrity**: See `DATA_INTEGRITY_REPORT.md` for data validation issues

---

**Generated by**: AGENT_ARCHITECTURE_DOC  
**Date**: 2024-11-20  
**Version**: 1.0.0
