pub mod core;
pub mod features;
pub mod state;

use dashmap::DashMap;
use features::sounds::commands::SoundsState;
use state::AppState;
use parking_lot::{Mutex, RwLock};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug")).init();

    log::info!("Starting Tibia Assets Editor - EXTREME PERFORMANCE MODE");

    // CLI Argument Parsing for Headless Validation
    let args: Vec<String> = std::env::args().collect();
    if let Some(validate_idx) = args.iter().position(|arg| arg == "--validate") {
        if let Some(path_str) = args.get(validate_idx + 1) {
            let path = std::path::Path::new(path_str);

            let mut appearances_path = None;
            let mut catalog_path = None;

            if let Ok(entries) = std::fs::read_dir(path) {
                for entry in entries.flatten() {
                    let file_name = entry.file_name().to_string_lossy().to_string();
                    if (file_name.starts_with("appearances-") && file_name.ends_with(".dat")) || file_name == "appearances.dat" {
                        appearances_path = Some(entry.path());
                    } else if file_name == "catalog-content.json" {
                        catalog_path = Some(entry.path());
                    }
                }
            }

            // Fallback: Check inside catalog-content.json if explicit file wasn't found
            if appearances_path.is_none() {
                if let Some(ref cat_path) = catalog_path {
                    if let Ok(Some(file)) = features::appearances::parsers::catalog::find_appearances_file_in_catalog(cat_path) {
                        let p = path.join(file);
                        if p.exists() {
                            appearances_path = Some(p);
                        }
                    }
                }
            }

            if let (Some(app_path), Some(cat_path)) = (appearances_path, catalog_path) {
                match features::appearances::parsers::load_appearances(&app_path) {
                    Ok(appearances) => {
                        let stats = features::appearances::parsers::get_statistics(&appearances);
                        match features::sprites::parsers::SpriteLoader::new(cat_path.as_path(), path) {
                            Ok(loader) => {
                                let result = serde_json::json!({
                                    "status": "success",
                                    "appearances": stats,
                                    "sprites": loader.sprite_count(),
                                });
                                println!("{}", serde_json::to_string_pretty(&result).unwrap());
                                std::process::exit(0);
                            }
                            Err(e) => {
                                eprintln!("Failed to load sprites: {}", e);
                                std::process::exit(1);
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to load appearances: {}", e);
                        std::process::exit(1);
                    }
                }
            } else {
                eprintln!("Could not find appearances-*.dat or catalog-content.json in {:?}", path);
                std::process::exit(1);
            }
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            // parking_lot locks: 3x faster than std::sync
            appearances: RwLock::new(None),
            sprite_loader: RwLock::new(None),
            tibia_path: Mutex::new(None),
            sprite_cache: DashMap::new(),

            // O(1) lookup indexes (no more linear scans!)
            object_index: DashMap::with_hasher(ahash::RandomState::new()),
            outfit_index: DashMap::with_hasher(ahash::RandomState::new()),
            effect_index: DashMap::with_hasher(ahash::RandomState::new()),
            missile_index: DashMap::with_hasher(ahash::RandomState::new()),

            // Search result cache
            search_cache: DashMap::with_hasher(ahash::RandomState::new()),

            flags_clipboard: Mutex::new(None),
        })
        .manage(SoundsState::new())
        .invoke_handler(tauri::generate_handler![
            // Appearances API
            features::appearances::commands::load_appearances_file,
            features::appearances::commands::get_appearance_stats,
            features::appearances::commands::select_tibia_directory,
            features::appearances::commands::list_appearance_files,
            features::appearances::commands::get_catalog_appearances_file,
            features::appearances::commands::list_appearances_by_category,
            features::appearances::commands::find_appearance_position,
            features::appearances::commands::get_appearance_details,
            features::appearances::commands::get_appearance_count,
            features::appearances::commands::get_item_subcategories,
            features::appearances::commands::get_complete_appearance,
            features::appearances::commands::get_special_meaning_ids,
            features::appearances::commands::update_appearance_name,
            features::appearances::commands::update_appearance_description,
            features::appearances::commands::update_appearance_flag_bool,
            features::appearances::commands::update_appearance_light,
            features::appearances::commands::update_appearance_shift,
            features::appearances::commands::update_appearance_height,
            features::appearances::commands::update_appearance_write,
            features::appearances::commands::update_appearance_write_once,
            features::appearances::commands::update_appearance_automap,
            features::appearances::commands::update_appearance_hook,
            features::appearances::commands::update_appearance_lenshelp,
            features::appearances::commands::update_appearance_clothes,
            features::appearances::commands::update_appearance_default_action,
            features::appearances::commands::update_appearance_market,
            features::appearances::commands::update_appearance_bank,
            features::appearances::commands::update_appearance_changed_to_expire,
            features::appearances::commands::update_appearance_cyclopedia_item,
            features::appearances::commands::update_appearance_upgrade_classification,
            features::appearances::commands::update_appearance_skillwheel_gem,
            features::appearances::commands::update_appearance_imbueable,
            features::appearances::commands::update_appearance_proficiency,
            features::appearances::commands::update_appearance_transparency_level,
            features::appearances::commands::update_appearance_weapon_type,
            features::appearances::commands::update_appearance_texture_settings,
            features::appearances::commands::save_appearances_file,
            features::appearances::commands::export_appearance_to_json,
            features::appearances::commands::import_appearance_from_json,
            features::appearances::commands::duplicate_appearance,
            features::appearances::commands::create_empty_appearance,
            features::appearances::commands::copy_appearance_flags,
            features::appearances::commands::paste_appearance_flags,
            features::appearances::commands::delete_appearance,
            // Sprites API
            features::sprites::commands::load_sprites_catalog,
            features::sprites::commands::auto_load_sprites,
            features::sprites::commands::get_sprite_by_id,
            features::sprites::commands::get_appearance_sprites,
            features::sprites::commands::get_appearance_preview_sprite,
            features::sprites::commands::clear_sprite_cache,
            features::sprites::commands::get_sprite_cache_stats,
            // Batch sprite loading - MASSIVE performance boost for preview grids
            features::sprites::commands::get_appearance_sprites_batch,
            features::sprites::commands::get_appearance_preview_sprites_batch,
            // Sprites with metadata - For correct rendering of non-64x64 sprites
            features::sprites::commands::get_sprite_by_id_with_metadata,
            features::sprites::commands::get_appearance_sprites_with_metadata,
            // Sounds API
            features::sounds::commands::load_sounds_file,
            features::sounds::commands::get_sounds_stats,
            features::sounds::commands::list_sound_types,
            features::sounds::commands::get_sound_by_id,
            features::sounds::commands::get_sounds_by_type,
            features::sounds::commands::list_all_sounds,
            features::sounds::commands::list_numeric_sound_effects,
            features::sounds::commands::get_sound_effect_count,
            features::sounds::commands::get_sound_audio_data,
            features::sounds::commands::get_sound_file_path,
            features::sounds::commands::get_numeric_sound_effect_by_id,
            features::sounds::commands::list_ambience_streams,
            features::sounds::commands::get_ambience_stream_by_id,
            features::sounds::commands::get_ambience_stream_count,
            features::sounds::commands::list_ambience_object_streams,
            features::sounds::commands::get_ambience_object_stream_by_id,
            features::sounds::commands::get_ambience_object_stream_count,
            features::sounds::commands::list_music_templates,
            features::sounds::commands::get_music_template_by_id,
            features::sounds::commands::get_music_template_count,
            features::sounds::commands::update_sound_info,
            features::sounds::commands::update_numeric_sound_effect,
            features::sounds::commands::update_ambience_stream,
            features::sounds::commands::update_ambience_object_stream,
            features::sounds::commands::update_music_template,
            features::sounds::commands::save_sounds_file,
            features::sounds::commands::add_sound,
            features::sounds::commands::delete_sound,
            features::sounds::commands::add_numeric_sound_effect,
            features::sounds::commands::delete_numeric_sound_effect,
            features::sounds::commands::import_and_add_sound,
            // Settings API
            features::settings::set_tibia_base_path,
            features::settings::get_tibia_base_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
