/**
 * Tauri IPC Command Constants
 * 
 * Centralized command names to prevent typos and improve type safety.
 * All invoke() calls should use these constants instead of string literals.
 */

export const COMMANDS = {
  // Appearances Commands
  LOAD_APPEARANCES_FILE: 'load_appearances_file',
  GET_APPEARANCE_STATS: 'get_appearance_stats',
  SELECT_TIBIA_DIRECTORY: 'select_tibia_directory',
  LIST_APPEARANCE_FILES: 'list_appearance_files',
  LIST_APPEARANCES_BY_CATEGORY: 'list_appearances_by_category',
  FIND_APPEARANCE_POSITION: 'find_appearance_position',
  GET_APPEARANCE_DETAILS: 'get_appearance_details',
  GET_APPEARANCE_COUNT: 'get_appearance_count',
  GET_ITEM_SUBCATEGORIES: 'get_item_subcategories',
  GET_COMPLETE_APPEARANCE: 'get_complete_appearance',
  GET_SPECIAL_MEANING_IDS: 'get_special_meaning_ids',
  
  // Appearance Updates
  UPDATE_APPEARANCE_NAME: 'update_appearance_name',
  UPDATE_APPEARANCE_DESCRIPTION: 'update_appearance_description',
  UPDATE_APPEARANCE_FLAG_BOOL: 'update_appearance_flag_bool',
  UPDATE_APPEARANCE_LIGHT: 'update_appearance_light',
  UPDATE_APPEARANCE_SHIFT: 'update_appearance_shift',
  UPDATE_APPEARANCE_HEIGHT: 'update_appearance_height',
  UPDATE_APPEARANCE_WRITE: 'update_appearance_write',
  UPDATE_APPEARANCE_WRITE_ONCE: 'update_appearance_write_once',
  UPDATE_APPEARANCE_AUTOMAP: 'update_appearance_automap',
  UPDATE_APPEARANCE_HOOK: 'update_appearance_hook',
  UPDATE_APPEARANCE_LENSHELP: 'update_appearance_lenshelp',
  UPDATE_APPEARANCE_CLOTHES: 'update_appearance_clothes',
  UPDATE_APPEARANCE_DEFAULT_ACTION: 'update_appearance_default_action',
  UPDATE_APPEARANCE_MARKET: 'update_appearance_market',
  UPDATE_APPEARANCE_BANK: 'update_appearance_bank',
  UPDATE_APPEARANCE_CHANGED_TO_EXPIRE: 'update_appearance_changed_to_expire',
  UPDATE_APPEARANCE_CYCLOPEDIA_ITEM: 'update_appearance_cyclopedia_item',
  UPDATE_APPEARANCE_UPGRADE_CLASSIFICATION: 'update_appearance_upgrade_classification',
  UPDATE_APPEARANCE_SKILLWHEEL_GEM: 'update_appearance_skillwheel_gem',
  UPDATE_APPEARANCE_IMBUEABLE: 'update_appearance_imbueable',
  UPDATE_APPEARANCE_PROFICIENCY: 'update_appearance_proficiency',
  UPDATE_APPEARANCE_TRANSPARENCY_LEVEL: 'update_appearance_transparency_level',
  UPDATE_APPEARANCE_WEAPON_TYPE: 'update_appearance_weapon_type',
  UPDATE_APPEARANCE_TEXTURE_SETTINGS: 'update_appearance_texture_settings',
  
  // Sprite Operations
  REPLACE_APPEARANCE_SPRITES: 'replace_appearance_sprites',
  REMOVE_APPEARANCE_SPRITES: 'remove_appearance_sprites',
  APPEND_APPEARANCE_SPRITES: 'append_appearance_sprites',
  
  // File Operations
  SAVE_APPEARANCES_FILE: 'save_appearances_file',
  EXPORT_APPEARANCE_TO_JSON: 'export_appearance_to_json',
  IMPORT_APPEARANCE_FROM_JSON: 'import_appearance_from_json',
  
  // Appearance Management
  DUPLICATE_APPEARANCE: 'duplicate_appearance',
  CREATE_EMPTY_APPEARANCE: 'create_empty_appearance',
  COPY_APPEARANCE_FLAGS: 'copy_appearance_flags',
  PASTE_APPEARANCE_FLAGS: 'paste_appearance_flags',
  DELETE_APPEARANCE: 'delete_appearance',
  
  // Sprites Commands
  LOAD_SPRITES_CATALOG: 'load_sprites_catalog',
  AUTO_LOAD_SPRITES: 'auto_load_sprites',
  GET_SPRITE_BY_ID: 'get_sprite_by_id',
  GET_APPEARANCE_SPRITES: 'get_appearance_sprites',
  GET_APPEARANCE_PREVIEW_SPRITE: 'get_appearance_preview_sprite',
  CLEAR_SPRITE_CACHE: 'clear_sprite_cache',
  GET_SPRITE_CACHE_STATS: 'get_sprite_cache_stats',
  GET_APPEARANCE_SPRITES_BATCH: 'get_appearance_sprites_batch',
  GET_APPEARANCE_PREVIEW_SPRITES_BATCH: 'get_appearance_preview_sprites_batch',
  
  // Sounds Commands
  LOAD_SOUNDS_FILE: 'load_sounds_file',
  GET_SOUNDS_STATS: 'get_sounds_stats',
  LIST_SOUND_TYPES: 'list_sound_types',
  GET_SOUND_BY_ID: 'get_sound_by_id',
  GET_SOUNDS_BY_TYPE: 'get_sounds_by_type',
  LIST_ALL_SOUNDS: 'list_all_sounds',
  LIST_NUMERIC_SOUND_EFFECTS: 'list_numeric_sound_effects',
  GET_SOUND_EFFECT_COUNT: 'get_sound_effect_count',
  GET_SOUND_AUDIO_DATA: 'get_sound_audio_data',
  GET_SOUND_FILE_PATH: 'get_sound_file_path',
  GET_NUMERIC_SOUND_EFFECT_BY_ID: 'get_numeric_sound_effect_by_id',
  LIST_AMBIENCE_STREAMS: 'list_ambience_streams',
  GET_AMBIENCE_STREAM_BY_ID: 'get_ambience_stream_by_id',
  GET_AMBIENCE_STREAM_COUNT: 'get_ambience_stream_count',
  LIST_AMBIENCE_OBJECT_STREAMS: 'list_ambience_object_streams',
  GET_AMBIENCE_OBJECT_STREAM_BY_ID: 'get_ambience_object_stream_by_id',
  GET_AMBIENCE_OBJECT_STREAM_COUNT: 'get_ambience_object_stream_count',
  LIST_MUSIC_TEMPLATES: 'list_music_templates',
  GET_MUSIC_TEMPLATE_BY_ID: 'get_music_template_by_id',
  GET_MUSIC_TEMPLATE_COUNT: 'get_music_template_count',
  UPDATE_SOUND_INFO: 'update_sound_info',
  UPDATE_NUMERIC_SOUND_EFFECT: 'update_numeric_sound_effect',
  UPDATE_AMBIENCE_STREAM: 'update_ambience_stream',
  UPDATE_AMBIENCE_OBJECT_STREAM: 'update_ambience_object_stream',
  UPDATE_MUSIC_TEMPLATE: 'update_music_template',
  SAVE_SOUNDS_FILE: 'save_sounds_file',
  ADD_SOUND: 'add_sound',
  DELETE_SOUND: 'delete_sound',
  ADD_NUMERIC_SOUND_EFFECT: 'add_numeric_sound_effect',
  DELETE_NUMERIC_SOUND_EFFECT: 'delete_numeric_sound_effect',
  IMPORT_AND_ADD_SOUND: 'import_and_add_sound',
  
  // Monsters Commands
  LIST_MONSTER_FILES: 'list_monster_files',
  LOAD_MONSTER_FILE: 'load_monster_file',
  SAVE_MONSTER_FILE: 'save_monster_file',
  RENAME_MONSTER_FILE: 'rename_monster_file',
  LIST_BESTIARY_CLASSES: 'list_bestiary_classes',
  
  // Settings Commands
  SET_TIBIA_BASE_PATH: 'set_tibia_base_path',
  GET_TIBIA_BASE_PATH: 'get_tibia_base_path',
  SET_MONSTER_BASE_PATH: 'set_monster_base_path',
  GET_MONSTER_BASE_PATH: 'get_monster_base_path',
  
  // Cache Management Commands
  GET_CACHE_STATISTICS: 'get_cache_statistics',
  CLEAR_ALL_CACHES: 'clear_all_caches',
  CLEAR_CACHE_TYPE: 'clear_cache_type',
} as const;

// Type for command names
export type CommandName = typeof COMMANDS[keyof typeof COMMANDS];

// DOM Selectors
export const SELECTORS = {
  // Main containers
  ASSETS_GRID: '#assets-grid',
  ASSETS_BROWSER: '#assets-browser',
  ASSET_DETAILS: '#asset-details',
  DETAILS_CONTENT: '#details-content',
  EDIT_CONTENT: '#edit-content',
  TEXTURE_CONTENT: '#texture-content',
  
  // Search and filters
  ASSET_SEARCH: '#asset-search',
  CLEAR_SEARCH: '#clear-search',
  SEARCH_BTN: '#search-btn',
  SUBCATEGORY_SELECT: '#subcategory-select',
  SUBCATEGORY_CONTAINER: '#subcategory-container',
  
  // Pagination
  RESULTS_COUNT: '#results-count',
  PAGE_INFO: '#page-info',
  PREV_PAGE: '#prev-page',
  NEXT_PAGE: '#next-page',
  PAGE_SIZE: '#page-size',
  
  // Navigation
  PREV_ASSET: '#prev-asset',
  NEXT_ASSET: '#next-asset',
  
  // Tabs
  TAB_DETAILS: '#tab-details',
  TAB_EDIT: '#tab-edit',
  TAB_TEXTURE: '#tab-texture',
  
  // Settings
  SETTINGS_BTN: '#settings-btn',
  SETTINGS_MENU: '#settings-menu',
  LANGUAGE_SELECT: '#language-select',
  AUTO_ANIMATE_TOGGLE: '#auto-animate-toggle',
  CLEAR_CACHE_BTN: '#clear-cache-btn',
  REFRESH_BTN: '#refresh-btn',
  HOME_BTN: '#home-btn',
  
  // UI elements
  LOADING_SCREEN: '#loading-screen',
  MAIN_APP: '#main-app',
  SOUNDS_COUNT: '#sounds-count',
} as const;

// Type for selector names
export type SelectorName = typeof SELECTORS[keyof typeof SELECTORS];

// Constants
export const CONSTANTS = {
  // Storage keys
  LAST_TIBIA_PATH_KEY: 'lastTibiaPath',
  THEME_STORAGE_KEY: 'appThemePreference',
  LANGUAGE_STORAGE_KEY: 'languagePreference',
  AUTO_ANIMATE_KEY: 'autoAnimateGridEnabled',
  STORAGE_VERSION_KEY: 'storageVersion',
  
  // Storage version
  STORAGE_VERSION: '1.0',
  
  // Cache limits
  MAX_SPRITE_CACHE_SIZE: 1000,
  MAX_PREVIEW_CACHE_SIZE: 500,
  MAX_QUERY_CACHE_SIZE: 100,
  
  // Rendering
  INITIAL_SPRITE_RENDER_COUNT: 48,
  SPRITE_RENDER_CHUNK: 24,
  PREVIEW_BATCH_SIZE: 12,
  ANIMATION_BATCH_SIZE: 24,
  
  // Timing
  SEARCH_DEBOUNCE_MS: 300,
  IDLE_CALLBACK_TIMEOUT: 300,
  
  // Defaults
  DEFAULT_PAGE_SIZE: 100,
  DEFAULT_THEME: 'default',
  DEFAULT_LANGUAGE: 'en',
} as const;
