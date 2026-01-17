mod screenshots;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Debug)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![screenshots::screenshots_take])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
