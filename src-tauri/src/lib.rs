pub mod core;
mod commands;

use std::sync::Mutex;
use std::collections::HashMap;
use commands::AppState;

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
            commands::appearances_api::save_appearances_file,
            commands::settings::set_tibia_base_path,
            commands::settings::get_tibia_base_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
