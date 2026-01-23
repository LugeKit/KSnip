use tauri::{
    http::{Request, Response, StatusCode},
    Runtime, UriSchemeContext,
};
use tauri_plugin_log::log::info;
use url::form_urlencoded::{self};

pub fn handle<R: Runtime>(
    _ctx: UriSchemeContext<'_, R>,
    request: Request<Vec<u8>>,
) -> Response<Vec<u8>> {
    let response_builder = Response::builder().header("Access-Control-Allow-Origin", "*");
    match internal_handle(_ctx, request) {
        Ok(body) => response_builder.status(StatusCode::OK).body(body).unwrap(),
        Err(e) => response_builder
            .status(StatusCode::BAD_REQUEST)
            .body(e.into_bytes())
            .unwrap(),
    }
}

fn internal_handle<R: Runtime>(
    _ctx: UriSchemeContext<'_, R>,
    request: Request<Vec<u8>>,
) -> Result<Vec<u8>, String> {
    let uri = request.uri();
    let raw_path = uri.path();
    let decoded_path = percent_encoding::percent_decode_str(raw_path).decode_utf8_lossy();

    let (_, query) = match decoded_path.split_once('?') {
        Some((path, query)) => (path, Some(query)),
        None => (raw_path, uri.query()),
    };

    info!(
        "[protocol] uri: {}, path: {}, query: {:?}, decoded_path: {}, raw_query: {:?}",
        uri,
        raw_path,
        query,
        decoded_path,
        uri.query()
    );

    let query = query.ok_or(String::from("query is empty"))?;
    let mut parsed = form_urlencoded::parse(query.as_bytes());
    let id = parsed
        .find(|(k, _)| k == "id")
        .map(|(_, v)| v.into_owned())
        .ok_or(String::from("id is empty"))?;

    info!("[protocol] id: {}", id);

    Ok(Vec::new())
}
