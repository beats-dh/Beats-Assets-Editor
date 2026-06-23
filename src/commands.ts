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
  SEARCH_APPEARANCES_BY_FLAGS: 'search_appearances_by_flags',
  GET_APPEARANCE_DETAILS: 'get_appearance_details',
  GET_APPEARANCE_COUNT: 'get_appearance_count',
  GET_ITEM_SUBCATEGORIES: 'get_item_subcategories',
  GET_COMPLETE_APPEARANCE: 'get_complete_appearance',
  GET_COMPLETE_APPEARANCES_BATCH: 'get_complete_appearances_batch',
  GET_APPEARANCE_RAW_DUMP: 'get_appearance_raw_dump',
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
  UPDATE_APPEARANCE_WEAPON_TYPE: 'update_appearance_weapon_type',
  UPDATE_APPEARANCE_TEXTURE_SETTINGS: 'update_appearance_texture_settings',
  UPDATE_APPEARANCE_MINIMUM_LEVEL: 'update_appearance_minimum_level',
  UPDATE_APPEARANCE_RESTRICT_TO_VOCATION: 'update_appearance_restrict_to_vocation',
  UPDATE_APPEARANCE_NPC_SALE_DATA: 'update_appearance_npc_sale_data',

  // Sprite Operations
  REPLACE_APPEARANCE_SPRITES: 'replace_appearance_sprites',
  REMOVE_APPEARANCE_SPRITES: 'remove_appearance_sprites',
  APPEND_APPEARANCE_SPRITES: 'append_appearance_sprites',

  // File Operations
  SAVE_APPEARANCES_FILE: 'save_appearances_file',
  EXPORT_APPEARANCE_TO_JSON: 'export_appearance_to_json',
  EXPORT_APPEARANCE_TO_AEC: 'export_appearance_to_aec',
  IMPORT_APPEARANCE_FROM_JSON: 'import_appearance_from_json',
  IMPORT_APPEARANCES_FROM_FILES: 'import_appearances_from_files',
  IMPORT_APPEARANCES_FROM_FILES_ALL: 'import_appearances_from_files_all',
  GET_IMPORT_CONTEXT: 'get_import_context',

  // Appearance Management
  DUPLICATE_APPEARANCE: 'duplicate_appearance',
  DUPLICATE_APPEARANCES_BATCH: 'duplicate_appearances_batch',
  CHANGE_APPEARANCE_ID: 'change_appearance_id',
  ADD_FRAME_GROUP: 'add_frame_group',
  REMOVE_FRAME_GROUP: 'remove_frame_group',
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
  EXPORT_SPRITES_TO_PNG: 'export_sprites_to_png',
  SAVE_IMAGE_BYTES: 'save_image_bytes',
  IMPORT_IMAGE_AS_TILES: 'import_image_as_tiles',
  COMPILE_IMPORTED_SPRITES: 'compile_imported_sprites',
  COUNT_IMPORTED_SPRITES: 'count_imported_sprites',

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

  // Npcs Commands
  LIST_NPC_FILES: 'list_npc_files',
  LOAD_NPC_FILE: 'load_npc_file',
  SAVE_NPC_FILE: 'save_npc_file',
  RENAME_NPC_FILE: 'rename_npc_file',
  SYNC_NPC_SHOPS_FROM_PROTO: 'sync_npc_shops_from_proto',

  // Settings Commands
  SET_TIBIA_BASE_PATH: 'set_tibia_base_path',
  GET_TIBIA_BASE_PATH: 'get_tibia_base_path',
  SET_MONSTER_BASE_PATH: 'set_monster_base_path',
  GET_MONSTER_BASE_PATH: 'get_monster_base_path',
  SET_NPC_BASE_PATH: 'set_npc_base_path',
  GET_NPC_BASE_PATH: 'get_npc_base_path',
  GET_PRESETS: 'get_presets',
  SAVE_PRESET: 'save_preset',
  DELETE_PRESET: 'delete_preset',
  APPLY_PRESET: 'apply_preset',

  // Cache Management Commands
  GET_CACHE_STATISTICS: 'get_cache_statistics',
  CLEAR_ALL_CACHES: 'clear_all_caches',
  CLEAR_CACHE_TYPE: 'clear_cache_type',

  // StaticData & StaticMapData
  LOAD_STATICDATA_FILE: 'load_staticdata_file',
  LIST_STATICDATA_FILES: 'list_staticdata_files',
  SAVE_STATICDATA_FILE: 'save_staticdata_file',
  REMOVE_STATICDATA_ITEM: 'remove_staticdata_item',
  UPDATE_STATICDATA_CREATURE: 'update_staticdata_creature',
  UPDATE_STATICDATA_BOSS: 'update_staticdata_boss',
  UPDATE_STATICDATA_QUEST: 'update_staticdata_quest',
  UPDATE_STATICDATA_TITLE: 'update_staticdata_title',
  LOAD_STATICMAPDATA_FILE: 'load_staticmapdata_file',
  LIST_STATICMAPDATA_FILES: 'list_staticmapdata_files',
  GET_STATICDATA_CREATURES: 'get_staticdata_creatures',
  GET_STATICDATA_TITLES: 'get_staticdata_titles',
  GET_STATICDATA_HOUSES: 'get_staticdata_houses',
  GET_STATICDATA_BOSSES: 'get_staticdata_bosses',
  GET_STATICDATA_QUESTS: 'get_staticdata_quests',
  GET_STATICMAPDATA_HOUSES: 'get_staticmapdata_houses',

  // Proficiency Editor Commands
  LOAD_PROFICIENCY_FILE: 'load_proficiency_file',
  SAVE_PROFICIENCY_FILE: 'save_proficiency_file',
  INSPECT_PROFICIENCY_FILE: 'inspect_proficiency_file',
  SCAN_PROFICIENCY_ITEMS_XML: 'scan_proficiency_items_xml',
  UPDATE_ITEM_PROFICIENCY_XML: 'update_item_proficiency_xml',
  SYNC_PROFICIENCY_ITEMS_XML: 'sync_proficiency_items_xml',

  // DAT Merge Commands
  LOAD_MERGE_FOLDER: 'load_merge_folder',
  LOAD_MERGE_SOURCE: 'load_merge_source',
  GET_MERGE_PREVIEW: 'get_merge_preview',
  EXECUTE_DAT_MERGE: 'execute_dat_merge',
  UNLOAD_MERGE_SOURCE: 'unload_merge_source',
  SAVE_MERGED_DAT: 'save_merged_dat',
  LOAD_MERGE_SOURCE_ASSETS: 'load_merge_source_assets',
  GET_SPRITE_MERGE_PREVIEW: 'get_sprite_merge_preview',
  EXECUTE_SPRITE_MERGE: 'execute_sprite_merge',
  GET_STATICDATA_MERGE_PREVIEW: 'get_staticdata_merge_preview',
  EXECUTE_STATICDATA_MERGE: 'execute_staticdata_merge',
  SAVE_ALL_MERGE: 'save_all_merge',

  // QM Translation Editor Commands
  QM_FIND_FILES: 'qm_find_files',
  QM_LOAD: 'qm_load',
  QM_GET_ENTRIES: 'qm_get_entries',
  QM_UPDATE_TRANSLATION: 'qm_update_translation',
  QM_UPDATE_TRANSLATIONS: 'qm_update_translations',
  QM_SAVE: 'qm_save',
  QM_EXPORT_CSV: 'qm_export_csv',
  QM_IMPORT_CSV: 'qm_import_csv',
  QM_DEBUG_RAW: 'qm_debug_raw',

  // RCC Editor Commands
  RCC_LOAD: 'rcc_load',
  RCC_GET_RESOURCE: 'rcc_get_resource',
  RCC_REPLACE_RESOURCE: 'rcc_replace_resource',
  RCC_SAVE: 'rcc_save',
  RCC_EXTRACT_ALL: 'rcc_extract_all',
  RCC_EXTRACT_SINGLE: 'rcc_extract_single',
  RCC_GET_FILES: 'rcc_get_files',
  RCC_REPLACE_FROM_FILE: 'rcc_replace_from_file',
  RCC_DELETE_RESOURCE: 'rcc_delete_resource',
  RCC_FIND_FILES: 'rcc_find_files',
  RCC_ADD_RESOURCE: 'rcc_add_resource',
  RCC_INSTALL_TO_CLIENT: 'rcc_install_to_client',
  RCC_SPELL_ICON_COUNT: 'rcc_spell_icon_count',
  RCC_SPELL_SHEET_PNG: 'rcc_spell_sheet_png',
  RCC_ADD_OR_REPLACE_SPELL_ICON: 'rcc_add_or_replace_spell_icon',
  RCC_REMOVE_SPELL_ICON: 'rcc_remove_spell_icon',
  RCC_MOVE_SPELL_ICON: 'rcc_move_spell_icon',
  RCC_IMAGE_INFO: 'rcc_image_info',
  RCC_IMAGE_ADD_OR_REPLACE: 'rcc_image_add_or_replace',
  RCC_IMAGE_REMOVE: 'rcc_image_remove',
  RCC_IMAGE_MOVE: 'rcc_image_move',
  RCC_DETECT_QT_RCC: 'rcc_detect_qt_rcc',
  RCC_INSTALL_TO_CLIENT_QT: 'rcc_install_to_client_qt',

  // EXE (compiled-in Qt resources) Commands — read-only source
  EXE_FIND_FILES: 'exe_find_files',
  EXE_LOAD: 'exe_load',
  EXE_GET_RESOURCE: 'exe_get_resource',
  EXE_GET_FILES: 'exe_get_files',
  EXE_REPLACE_RESOURCE: 'exe_replace_resource',
  EXE_EXTRACT_ALL: 'exe_extract_all',
  EXE_EXTRACT_SINGLE: 'exe_extract_single',
  EXE_APPLY_TO_CLIENT: 'exe_apply_to_client',
  EXE_PATCH_SPELL_PATHS: 'exe_patch_spell_paths',
  EXE_CAN_APPLY_RESOURCE: 'exe_can_apply_resource',
  EXE_APPLY_RESOURCE: 'exe_apply_resource',
  EXE_REPLACE_RESOURCE_FROM_FILE: 'exe_replace_resource_from_file',
  EXE_APPLY_SPELL_TO_DISK: 'exe_apply_spell_to_disk',
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

  // Defaults
  DEFAULT_THEME: 'default',
  DEFAULT_LANGUAGE: 'en',
} as const;
