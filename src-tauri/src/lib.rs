mod ai;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ai::ai_status, ai::ai_configure, ai::ai_forget_key, ai::ai_complete])
        .run(tauri::generate_context!())
        .expect("error while running mova");
}
