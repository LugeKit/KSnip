use std::borrow::Cow;

use arboard::{Clipboard, ImageData};

pub fn save_text_to_clipboard<'a, S: Into<&'a str>>(text: S) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(text.into()).map_err(|e| e.to_string())?;
    Ok(())
}

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
