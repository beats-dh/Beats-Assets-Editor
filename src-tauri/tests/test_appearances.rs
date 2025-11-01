use tibia_assets_editor_lib::core::{get_statistics, load_appearances};

#[test]
#[ignore] // Run with: cargo test -- --ignored --nocapture
fn test_load_tibia_appearances() {
    env_logger::init();

    let path = r"C:\Users\danie\Documentos\Tibia15Igla\assets\appearances-feee1f9feba00a63606228c8bc46fa003c90dff144fb1b60a3759f97aad6e3c8.dat";

    println!("Loading appearances from: {}", path);

    match load_appearances(path) {
        Ok(appearances) => {
            let stats = get_statistics(&appearances);
            println!("\n=== Appearance Statistics (Assets Editor Format) ===");
            println!("Objects:  {}", stats.object_count);
            println!("Outfits:  {}", stats.outfit_count);
            println!("Effects:  {}", stats.effect_count);
            println!("Missiles: {}", stats.missile_count);
            println!("\n=== Actual Item Counts ===");
            println!("Objects:  {}", stats.actual_objects);
            println!("Outfits:  {}", stats.actual_outfits);
            println!("Effects:  {}", stats.actual_effects);
            println!("Missiles: {}", stats.actual_missiles);
            println!("=============================\n");

            assert!(stats.object_count > 0, "Should have objects");
        }
        Err(e) => {
            panic!("Failed to load appearances: {:?}", e);
        }
    }
}
