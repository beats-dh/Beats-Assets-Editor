use serde::{Deserialize, Serialize};
use std::path::Path;
use std::fs;
use anyhow::{Result, Context};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct CatalogEntry {
    #[serde(rename = "type")]
    pub entry_type: String,
    pub file: String,
}

pub fn find_appearances_file_in_catalog<P: AsRef<Path>>(catalog_path: P) -> Result<Option<String>> {
    let catalog_path = catalog_path.as_ref();
    if !catalog_path.exists() {
        return Ok(None);
    }

    let catalog_data = fs::read_to_string(catalog_path).context(format!("Failed to read catalog file: {:?}", catalog_path))?;
    let entries: Vec<CatalogEntry> = serde_json::from_str(&catalog_data).context("Failed to parse catalog JSON")?;

    for entry in entries {
        if entry.entry_type == "appearances" {
            return Ok(Some(entry.file));
        }
    }

    Ok(None)
}
