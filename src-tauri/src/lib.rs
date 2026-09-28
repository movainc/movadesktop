mod ai;
mod auth;

/// Development convenience: `npm run tauri dev` picks up MOVA_* variables from the repository's
/// `.env.local` / `.env` at runtime. Release builds ignore these files entirely.
#[cfg(debug_assertions)]
fn load_dev_env() {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("..");
    for name in [".env.local", ".env"] {
        let Ok(text) = std::fs::read_to_string(root.join(name)) else { continue };
        for line in text.lines().map(str::trim).filter(|l| !l.starts_with('#')) {
            if let Some((key, value)) = line.split_once('=') {
                let (key, value) = (key.trim(), value.trim().trim_matches('"'));
                if key.starts_with("MOVA_") && !value.is_empty() && std::env::var_os(key).is_none() {
                    std::env::set_var(key, value);
                }
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(debug_assertions)]
    load_dev_env();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            ai::ai_status,
            ai::ai_configure,
            ai::ai_forget_key,
            ai::ai_complete,
            auth::auth_status,
            auth::auth_configure_google,
            auth::auth_forget_google_client,
            auth::auth_sign_in_google,
            auth::auth_sign_out,
            auth::auth_connect_drive_files,
            auth::gdrive_list,
            auth::gdrive_read,
            auth::gdrive_write,
            auth::gdrive_create,
            auth::drive_pull,
            auth::drive_push,
        ])
        .run(tauri::generate_context!())
        .expect("error while running mova");
}
