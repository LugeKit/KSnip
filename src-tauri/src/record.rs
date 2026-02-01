use crate::{
    model::{AppState, LogicalParam, PhysicalParam},
    util,
};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_log::log::{info, warn};
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub fn record_start(
    app: AppHandle,
    param: LogicalParam,
    save_path: Option<String>,
    state: State<'_, AppState>,
) -> Result<String, String> {
    info!(
        "[record_start] Called successfully, param: {:?}, save_path: {:?}",
        param, save_path
    );
    param.validate()?;

    // Stop existing recording if any
    if let Err(e) = stop_recording_internal(&state) {
        warn!("[record_start] Failed to stop existing recording: {}", e);
    }

    let monitor = util::find_monitor(param.screen_x, param.screen_y)
        .ok_or(String::from("Monitor not found"))?;
    let physical_param = PhysicalParam::new(&monitor, &param);

    // Generate filename
    let start = SystemTime::now();
    let since_the_epoch = start
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?;
    let timestamp = since_the_epoch.as_secs();

    // Use save_path or default to document directory
    let target_dir = if let Some(path_str) = save_path.filter(|s| !s.is_empty()) {
        std::path::PathBuf::from(path_str)
    } else {
        app.path().document_dir().map_err(|e| e.to_string())?
    };

    if !target_dir.exists() {
        std::fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
    }

    let file_name = format!("recording_{}.mp4", timestamp);
    let file_path = target_dir.join(&file_name);
    let file_path_str = file_path.to_str().ok_or("Invalid path")?.to_string();

    #[cfg(target_os = "windows")]
    let args = vec![
        "-f".to_string(),
        "gdigrab".to_string(),
        "-framerate".to_string(),
        "30".to_string(),
        "-offset_x".to_string(),
        physical_param.left.to_string(),
        "-offset_y".to_string(),
        physical_param.top.to_string(),
        "-video_size".to_string(),
        format!("{}x{}", physical_param.width, physical_param.height),
        "-i".to_string(),
        "desktop".to_string(),
        "-c:v".to_string(),
        "libx264".to_string(),
        "-preset".to_string(),
        "ultrafast".to_string(),
        "-y".to_string(),
        file_path_str.clone(),
    ];

    #[cfg(target_os = "macos")]
    let args = vec![
        "-f".to_string(),
        "avfoundation".to_string(),
        "-framerate".to_string(),
        "30".to_string(),
        "-i".to_string(),
        "1".to_string(), // TODO: Dynamically select monitor index. Currently defaults to first screen.
        "-vf".to_string(),
        format!(
            "crop={}:{}:{}:{}",
            physical_param.width, physical_param.height, physical_param.left, physical_param.top
        ),
        "-c:v".to_string(),
        "libx264".to_string(),
        "-preset".to_string(),
        "ultrafast".to_string(),
        "-y".to_string(),
        file_path_str.clone(),
    ];

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    let args: Vec<String> = vec![];

    info!("[record_start] spawning ffmpeg with args: {:?}", args);

    let sidecar_command = app.shell().sidecar("ffmpeg").map_err(|e| e.to_string())?;
    let (mut _rx, child) = sidecar_command
        .args(args)
        .spawn()
        .map_err(|e| e.to_string())?;

    let mut process_guard = state.recording_process.lock().map_err(|e| e.to_string())?;
    *process_guard = Some(child);

    info!("[record_start] Recording started, file: {}", file_path_str);

    Ok(file_path_str)
}

#[tauri::command]
pub fn record_stop(state: State<'_, AppState>) -> Result<(), String> {
    info!("[record_stop] called");
    if stop_recording_internal(&state)? {
        Ok(())
    } else {
        Err(String::from("No recording in progress"))
    }
}

fn stop_recording_internal(state: &AppState) -> Result<bool, String> {
    let mut process_guard = state.recording_process.lock().map_err(|e| e.to_string())?;
    if let Some(mut child) = process_guard.take() {
        // Send 'q' to stop recording gracefully
        child.write(b"q").map_err(|e| e.to_string())?;
        info!("[stop_recording_internal] sent 'q' to ffmpeg process");
        Ok(true)
    } else {
        Ok(false)
    }
}
