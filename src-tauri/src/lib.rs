use arboard::{Clipboard, ImageData};
use base64::{engine::general_purpose, Engine as _};
use image::DynamicImage;
use screenshots::Screen;
use std::io::Cursor;
use std::sync::Mutex;

struct AppState {
    screenshot: Mutex<Option<DynamicImage>>,
}

#[tauri::command]
fn capture_screen(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let screens = Screen::all().map_err(|e| e.to_string())?;
    if let Some(screen) = screens.first() {
        let image = screen.capture().map_err(|e| e.to_string())?;

        // Convert to DynamicImage for later cropping
        let dynamic_image = DynamicImage::ImageRgba8(image);

        // Store in state
        let mut state_image = state.screenshot.lock().unwrap();
        *state_image = Some(dynamic_image.clone());

        // Convert to base64 for frontend display
        let mut buffer = Cursor::new(Vec::new());
        dynamic_image
            .write_to(&mut buffer, image::ImageFormat::Png)
            .map_err(|e| e.to_string())?;
        let base64_image = general_purpose::STANDARD.encode(buffer.into_inner());

        Ok(format!("data:image/png;base64,{}", base64_image))
    } else {
        Err("No screens found".to_string())
    }
}

#[tauri::command]
fn save_to_clipboard(
    state: tauri::State<'_, AppState>,
    x: u32,
    y: u32,
    width: u32,
    height: u32,
) -> Result<(), String> {
    let state_image = state.screenshot.lock().unwrap();
    if let Some(img) = &*state_image {
        // Ensure width and height are at least 1
        let width = width.max(1);
        let height = height.max(1);

        // Ensure crop area is within bounds
        let (img_width, img_height) = (img.width(), img.height());
        let x = x.min(img_width - 1);
        let y = y.min(img_height - 1);
        let width = width.min(img_width - x);
        let height = height.min(img_height - y);

        let cropped = img.crop_imm(x, y, width, height);
        let rgba8 = cropped.to_rgba8();
        let (w, h) = rgba8.dimensions();

        let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
        let image_data = ImageData {
            width: w as usize,
            height: h as usize,
            bytes: std::borrow::Cow::from(rgba8.into_raw()),
        };

        clipboard.set_image(image_data).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("No screenshot available".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .manage(AppState {
            screenshot: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![capture_screen, save_to_clipboard])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
