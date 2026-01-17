use tauri_plugin_log::log::info;

#[derive(serde::Deserialize, serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Param {
    left: i64,
    top: i64,
    width: i64,
    height: i64,
    screen_id: i64,
}

#[tauri::command]
pub fn screenshots_take(param: Param) -> Result<(), String> {
    info!("[screenshots] called successfully, param: {:?}", param);
    Ok(())
}