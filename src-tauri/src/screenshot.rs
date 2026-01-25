use image::ImageFormat;
use tauri_plugin_log::log::info;

use crate::{
    model::{AppState, LogicalParam, PhysicalParam},
    util,
};

#[tauri::command]
pub fn screenshot_take(param: LogicalParam) -> Result<(), String> {
    info!("[screenshots] called successfully, param: {:?}", param);
    param.validate()?;

    let monitor = util::find_monitor(param.screen_x, param.screen_y)
        .ok_or(String::from("monitor not found"))?;
    let physical_param = PhysicalParam::new(&monitor, &param);
    let image = monitor
        .capture_region(
            physical_param.left,
            physical_param.top,
            physical_param.width,
            physical_param.height,
        )
        .map_err(|e| e.to_string())?;

    util::save_image_to_clipboard(
        physical_param.width as usize,
        physical_param.height as usize,
        image.into_raw(),
    )?;
    Ok(())
}

#[tauri::command]
pub fn pin_create(param: LogicalParam, state: tauri::State<'_, AppState>) -> Result<i32, String> {
    info!("[pin_create] called successfully, param: {:?}", param);
    param.validate()?;

    let monitor = util::find_monitor(param.screen_x, param.screen_y)
        .ok_or(String::from("monitor not found"))?;
    let physical_param = PhysicalParam::new(&monitor, &param);

    info!(
        "[pin_create] monitor: {:?}, physical_param: {:?}",
        monitor.name(),
        physical_param
    );

    let image = monitor
        .capture_region(
            physical_param.left,
            physical_param.top,
            physical_param.width,
            physical_param.height,
        )
        .map_err(|e| e.to_string())?;

    let mut buffer = Vec::new();
    let mut cursor = std::io::Cursor::new(&mut buffer);
    image::DynamicImage::ImageRgba8(image)
        .write_to(&mut cursor, ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    let mut pin_images = state.pin_images.write().map_err(|e| e.to_string())?;
    let pin_id = pin_images.len() as i32 + 1;
    pin_images.insert(pin_id, buffer);
    info!("[pin_create] saved successfully for pin_id: {:?}", pin_id);

    Ok(pin_id)
}

#[tauri::command]
pub fn pin_delete(pin_id: i32, state: tauri::State<'_, AppState>) -> Result<(), String> {
    info!("[pin_delete] called successfully, pin_id: {}", pin_id);
    let mut pin_images = state.pin_images.write().map_err(|e| e.to_string())?;
    let removed = pin_images.remove(&pin_id);
    info!(
        "[pin_delete] removed pin_id: {}, removed ok: {}",
        pin_id,
        removed.is_some()
    );
    Ok(())
}

pub fn pin_get(pin_id: i32, state: tauri::State<'_, AppState>) -> Result<Vec<u8>, String> {
    info!("[pin_get] called successfully, pin_id: {:?}", pin_id);
    let pin_images = state.pin_images.read().map_err(|e| e.to_string())?;
    pin_images
        .get(&pin_id)
        .cloned()
        .ok_or(String::from("pin not found"))
}
