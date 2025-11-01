use std::env;
use tibia_assets_editor_lib::core::parsers::appearances::{get_statistics, load_appearances};

fn main() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let mut args = env::args().skip(1);
    let path = match args.next() {
        Some(p) => p,
        None => {
            eprintln!("Uso: load_appearances_cli <caminho_para_appearances.dat>");
            std::process::exit(1);
        }
    };

    match load_appearances(&path) {
        Ok(appearances) => {
            let stats = get_statistics(&appearances);
            println!("Arquivo: {}", path);
            println!(
                "Last IDs — Objects: {} | Outfits: {} | Effects: {} | Missiles: {}",
                stats.object_count, stats.outfit_count, stats.effect_count, stats.missile_count
            );
            println!(
                "Counts — Objects: {} | Outfits: {} | Effects: {} | Missiles: {}",
                stats.actual_objects,
                stats.actual_outfits,
                stats.actual_effects,
                stats.actual_missiles
            );
        }
        Err(e) => {
            eprintln!("Falha ao carregar appearances: {}", e);
            std::process::exit(2);
        }
    }
}
