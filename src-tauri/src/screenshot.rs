use tauri_plugin_log::log::info;

use crate::{
    model::{LogicalParam, PhysicalParam},
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
pub fn pin_create(param: LogicalParam) -> Result<i32, String> {
    info!("[pin_create] called successfully, param: {:?}", param);
    param.validate()?;
    Ok(1)
}
