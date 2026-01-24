use std::{collections::HashMap, sync::{Mutex, RwLock}};
use tauri_plugin_shell::process::CommandChild;

use xcap::Monitor;

pub struct AppState {
    pub pin_images: RwLock<HashMap<i32, Vec<u8>>>,
    pub recording_process: Mutex<Option<CommandChild>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            pin_images: RwLock::new(HashMap::new()),
            recording_process: Mutex::new(None),
        }
    }
}

#[derive(serde::Deserialize, serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LogicalParam {
    pub left: i32,
    pub top: i32,
    pub width: i32,
    pub height: i32,
    pub screen_x: i32,
    pub screen_y: i32,
}

impl LogicalParam {
    pub fn validate(&self) -> Result<(), String> {
        if self.left < 0 || self.top < 0 || self.width <= 0 || self.height <= 0 {
            return Err(String::from("invalid param"));
        }
        Ok(())
    }
}

#[derive(Debug)]
pub struct PhysicalParam {
    pub left: u32,
    pub top: u32,
    pub width: u32,
    pub height: u32,
}

impl PhysicalParam {
    pub fn new(monitor: &Monitor, param: &LogicalParam) -> Self {
        let scale_factor = monitor.scale_factor().unwrap_or(1.0);
        Self {
            left: (param.left as f32 * scale_factor).round() as u32,
            top: (param.top as f32 * scale_factor).round() as u32,
            width: (param.width as f32 * scale_factor).round() as u32,
            height: (param.height as f32 * scale_factor).round() as u32,
        }
    }
}
