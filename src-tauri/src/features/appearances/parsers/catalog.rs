use crate::features::sprites::parsers::SpriteCatalogEntry;
use anyhow::{Context, Result};
use std::fs;
use std::path::{Component, Path};

/// File name of the appearances `.dat` that `catalog-content.json` in `assets_dir`
/// points to (its `"type": "appearances"` entry), i.e. the file the client loads.
///
/// Returns `Ok(None)` when there is no catalog, it has no appearances entry, the entry
/// is not a bare file name (path separators, `..`, drive prefixes are rejected so the
/// catalog can't point outside `assets_dir`), or the file does not exist.
/// Errors only when the catalog exists but can't be read or parsed.
pub fn find_appearances_file_in_catalog(assets_dir: &Path) -> Result<Option<String>> {
    let catalog_path = assets_dir.join("catalog-content.json");
    if !catalog_path.is_file() {
        return Ok(None);
    }

    let data = fs::read_to_string(&catalog_path).with_context(|| format!("Failed to read {:?}", catalog_path))?;
    let entries: Vec<SpriteCatalogEntry> = serde_json::from_str(&data).with_context(|| format!("Failed to parse {:?}", catalog_path))?;

    let Some(file) = entries.into_iter().find(|e| e.entry_type == "appearances").map(|e| e.file) else {
        return Ok(None);
    };

    if !is_bare_file_name(&file) {
        log::warn!("Ignoring catalog appearances entry {:?}: not a plain file name", file);
        return Ok(None);
    }

    if !assets_dir.join(&file).is_file() {
        log::warn!("Catalog appearances file {:?} not found in {:?}", file, assets_dir);
        return Ok(None);
    }

    Ok(Some(file))
}

fn is_bare_file_name(name: &str) -> bool {
    if name.contains(['/', '\\']) {
        return false;
    }
    let mut components = Path::new(name).components();
    matches!((components.next(), components.next()), (Some(Component::Normal(c)), None) if c == name)
}
