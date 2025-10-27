pub mod core;
mod commands;

use std::sync::Mutex;
use std::collections::HashMap;
use commands::AppState;
use commands::sounds_api::SoundsState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug")).init();

    log::info!("Starting Tibia Assets Editor");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            appearances: Mutex::new(None),
            sprite_loader: Mutex::new(None),
            tibia_path: Mutex::new(None),
            sprite_cache: Mutex::new(HashMap::new()),
        })
        .manage(SoundsState::new())
        .invoke_handler(tauri::generate_handler![
            commands::appearances_api::load_appearances_file,
            commands::appearances_api::get_appearance_stats,
            commands::appearances_api::select_tibia_directory,
            commands::appearances_api::list_appearance_files,
            commands::appearances_api::list_appearances_by_category,
            commands::appearances_api::get_appearance_details,
            commands::appearances_api::get_appearance_count,
            commands::appearances_api::load_sprites_catalog,
            commands::appearances_api::auto_load_sprites,
            commands::appearances_api::get_sprite_by_id,
            commands::appearances_api::get_appearance_sprites,
            commands::appearances_api::clear_sprite_cache,
            commands::appearances_api::get_sprite_cache_stats,
            commands::appearances_api::get_item_subcategories,
            commands::appearances_api::get_complete_appearance,
            commands::appearances_api::update_appearance_name,
            commands::appearances_api::update_appearance_description,
            commands::appearances_api::update_appearance_flag_bool,
            commands::appearances_api::update_appearance_light,
            commands::appearances_api::update_appearance_shift,
            commands::appearances_api::update_appearance_height,
            commands::appearances_api::update_appearance_write,
            commands::appearances_api::update_appearance_write_once,
            commands::appearances_api::update_appearance_automap,
            commands::appearances_api::update_appearance_hook,
            commands::appearances_api::update_appearance_lenshelp,
            commands::appearances_api::update_appearance_clothes,
            commands::appearances_api::update_appearance_default_action,
            commands::appearances_api::update_appearance_market,
            commands::appearances_api::update_appearance_bank,
            commands::appearances_api::update_appearance_changed_to_expire,
            commands::appearances_api::update_appearance_cyclopedia_item,
            commands::appearances_api::update_appearance_upgrade_classification,
            commands::appearances_api::update_appearance_skillwheel_gem,
            commands::appearances_api::update_appearance_imbueable,
            commands::appearances_api::update_appearance_proficiency,
            commands::appearances_api::update_appearance_transparency_level,
            commands::appearances_api::update_appearance_weapon_type,
            commands::appearances_api::save_appearances_file,
            commands::settings::set_tibia_base_path,
            commands::settings::get_tibia_base_path,
            // Sounds API
            commands::sounds_api::load_sounds_file,
            commands::sounds_api::get_sounds_stats,
            commands::sounds_api::list_sound_types,
            commands::sounds_api::get_sound_by_id,
            commands::sounds_api::get_sounds_by_type,
            commands::sounds_api::list_all_sounds,
            commands::sounds_api::list_numeric_sound_effects,
            commands::sounds_api::get_sound_effect_count,
            commands::sounds_api::get_sound_audio_data,
            commands::sounds_api::get_sound_file_path,
            commands::sounds_api::get_numeric_sound_effect_by_id,
            // New sounds entities
            commands::sounds_api::list_ambience_streams,
            commands::sounds_api::get_ambience_stream_by_id,
            commands::sounds_api::get_ambience_stream_count,
            commands::sounds_api::list_ambience_object_streams,
            commands::sounds_api::get_ambience_object_stream_by_id,
            commands::sounds_api::get_ambience_object_stream_count,
            commands::sounds_api::list_music_templates,
            commands::sounds_api::get_music_template_by_id,
            commands::sounds_api::get_music_template_count,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
