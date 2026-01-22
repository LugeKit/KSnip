use std::borrow::Cow;

use arboard::{Clipboard, ImageData};
use xcap::Monitor;

pub fn save_image_to_clipboard(width: usize, height: usize, image: Vec<u8>) -> Result<(), String> {
    let image_data = ImageData {
        width,
        height,
        bytes: Cow::from(image),
    };
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_image(image_data).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn find_monitor(screen_x: i32, screen_y: i32) -> Option<Monitor> {
    Monitor::all()
        .ok()?
        .into_iter()
        .find(|m| m.x().is_ok_and(|x| x == screen_x) && m.y().is_ok_and(|y| y == screen_y))
}
