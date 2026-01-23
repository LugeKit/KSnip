use tauri::{
    http::{Request, Response, StatusCode},
    Runtime, UriSchemeContext,
};
use tauri_plugin_log::log::info;

pub fn handle<R: Runtime>(
    _ctx: UriSchemeContext<'_, R>,
    request: Request<Vec<u8>>,
) -> Response<Vec<u8>> {
    let path = request.uri().path();
    let response_builder = Response::builder().header("Access-Control-Allow-Origin", "*");

    info!("[protocol] path: {}", path);

    response_builder
        .status(StatusCode::OK)
        .body(Vec::new())
        .unwrap()
}
