use tauri_plugin_log::log::{debug, info};
use xcap::Monitor;

use crate::util;

#[derive(serde::Deserialize, serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LogicalParam {
    left: i32,
    top: i32,
    width: i32,
    height: i32,
    screen_x: i32,
    screen_y: i32,
}

#[derive(Debug)]
pub struct PhysicalParam {
    left: u32,
    top: u32,
    width: u32,
    height: u32,
}

#[tauri::command]
pub fn screenshots_take(param: LogicalParam) -> Result<(), String> {
    info!("[screenshots] called successfully, param: {:?}", param);

    if param.left < 0 || param.top < 0 || param.width <= 0 || param.height <= 0 {
        return Err(String::from("invalid param"));
    }

    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    debug!("[screenshots] monitors count: {}", monitors.len());

    let monitor = monitors.iter().find(|m| {
        m.x().is_ok_and(|x| x == param.screen_x) && m.y().is_ok_and(|y| y == param.screen_y)
    });

    if let Some(monitor) = monitor {
        let physical_param = logical_to_physical(monitor, &param);

        info!(
            "[screenshots] monitor found, id: {:?}, name: {:?}, physical_param: {:?}",
            monitor.id(),
            monitor.name(),
            physical_param,
        );

        let image = monitor
            .capture_region(physical_param.left, physical_param.top, physical_param.width, physical_param.height)
            .map_err(|e| e.to_string())?;
        util::save_image_to_clipboard(physical_param.width as usize, physical_param.height as usize, image.into_raw())?;
        return Ok(());
    };

    Err(String::from("monitor not found"))
}

fn logical_to_physical(monitor: &Monitor, param: &LogicalParam) -> PhysicalParam {
    let scale_factor = monitor.scale_factor().unwrap_or(1.0);
    PhysicalParam {
        left: (param.left as f32 * scale_factor).round() as u32,
        top: (param.top as f32 * scale_factor).round() as u32,
        width: (param.width as f32 * scale_factor).round() as u32,
        height: (param.height as f32 * scale_factor).round() as u32,
    }
}
