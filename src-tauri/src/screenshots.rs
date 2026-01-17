use tauri_plugin_log::log::{debug, info};
use xcap::Monitor;

#[derive(serde::Deserialize, serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Param {
    left: i32,
    top: i32,
    width: i32,
    height: i32,
    screen_x: i32,
    screen_y: i32,
}

#[tauri::command]
pub fn screenshots_take(param: Param) -> Result<(), String> {
    info!("[screenshots] called successfully, param: {:?}", param);

    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    debug!("[screenshots] monitors count: {}", monitors.len());

    let monitor = monitors.iter().find(|m| {
        m.x().is_ok_and(|x| x == param.screen_x) && m.y().is_ok_and(|y| y == param.screen_y)
    });

    if let Some(monitor) = monitor {
        info!(
            "[screenshots] monitor found, id: {:?}, name: {:?}",
            monitor.id(),
            monitor.name()
        );
        return Ok(());
    };

    Err(String::from("monitor not found"))
}
