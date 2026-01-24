use tauri::Manager;

mod model;
mod protocol;
mod record;
mod screenshot;
mod util;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Debug)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_macos_permissions::init())
        .invoke_handler(tauri::generate_handler![
            screenshot::screenshot_take,
            screenshot::pin_create,
            screenshot::pin_delete,
            record::record_start,
            record::record_stop,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if window.label() == "main" {
                    window.app_handle().exit(0);
                }
            }
        })
        .manage(model::AppState::default())
        .register_uri_scheme_protocol("ksnip", protocol::handle)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
