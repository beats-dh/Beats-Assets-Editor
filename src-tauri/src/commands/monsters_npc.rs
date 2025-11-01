use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use walkdir::WalkDir;

#[derive(Serialize)]
pub struct LuaScriptFile {
    pub path: String,
    pub content: String,
}

#[tauri::command]
pub async fn load_lua_scripts(path: String) -> Result<Vec<LuaScriptFile>, String> {
    let root = PathBuf::from(&path);
    if !root.exists() {
        return Err(format!("The provided path does not exist: {path}"));
    }
    if !root.is_dir() {
        return Err(format!("The provided path is not a directory: {path}"));
    }

    let mut scripts: Vec<LuaScriptFile> = Vec::new();

    for entry in WalkDir::new(&root).into_iter().filter_map(Result::ok) {
        let entry_path = entry.path();
        if entry_path.is_file() {
            if let Some(ext) = entry_path.extension() {
                if !ext.eq_ignore_ascii_case("lua") {
                    continue;
                }
            } else {
                continue;
            }

            match fs::read_to_string(entry_path) {
                Ok(content) => scripts.push(LuaScriptFile {
                    path: entry_path.to_string_lossy().to_string(),
                    content,
                }),
                Err(error) => {
                    log::warn!(
                        "Failed to read lua script at {}: {error}",
                        entry_path.display()
                    );
                }
            }
        }
    }

    scripts.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(scripts)
}
