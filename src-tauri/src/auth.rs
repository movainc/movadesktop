//! Google sign-in for a desktop app: OAuth 2.0 authorization code flow with PKCE and a loopback redirect
//! (https://developers.google.com/identity/protocols/oauth2/native-app), plus optional sync of the
//! workspace to the user's private Drive app-data folder.

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs,
    path::PathBuf,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpListener,
};

const AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const REVOKE_URL: &str = "https://oauth2.googleapis.com/revoke";
const USERINFO_URL: &str = "https://openidconnect.googleapis.com/v1/userinfo";
const DRIVE_SCOPE: &str = "https://www.googleapis.com/auth/drive.appdata";
const DRIVE_FILES_SCOPE: &str = "https://www.googleapis.com/auth/drive";
const DRIVE_FILE_NAME: &str = "mova-workspace.json";
const SIGN_IN_TIMEOUT: Duration = Duration::from_secs(300);

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct OAuthClient {
    client_id: String,
    client_secret: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Profile {
    sub: String,
    name: String,
    email: String,
    picture: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct Session {
    profile: Profile,
    access_token: String,
    refresh_token: Option<String>,
    expires_at: u64,
    scope: String,
}

#[derive(Serialize)]
pub struct AuthStatus {
    configured: bool,
    client_source: Option<&'static str>,
    profile: Option<Profile>,
    drive: bool,
    drive_files: bool,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    expires_in: u64,
    refresh_token: Option<String>,
    #[serde(default)]
    scope: String,
}

// ---------- storage ----------

fn config_file(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(name))
}

fn write_private(path: &PathBuf, contents: &str) -> Result<(), String> {
    fs::write(path, contents).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(path, fs::Permissions::from_mode(0o600));
    }
    Ok(())
}

fn read_json<T: for<'de> Deserialize<'de>>(app: &AppHandle, name: &str) -> Option<T> {
    let path = config_file(app, name).ok()?;
    serde_json::from_str(&fs::read_to_string(path).ok()?).ok()
}

fn load_client(app: &AppHandle) -> Option<(OAuthClient, &'static str)> {
    if let Ok(id) = std::env::var("MOVA_GOOGLE_CLIENT_ID") {
        if !id.trim().is_empty() {
            let secret = std::env::var("MOVA_GOOGLE_CLIENT_SECRET").ok().filter(|s| !s.trim().is_empty());
            return Some((OAuthClient { client_id: id.trim().into(), client_secret: secret }, "env"));
        }
    }
    read_json::<OAuthClient>(app, "google-oauth.json").map(|c| (c, "saved"))
}

fn load_session(app: &AppHandle) -> Option<Session> {
    read_json(app, "session.json")
}

fn save_session(app: &AppHandle, s: &Session) -> Result<(), String> {
    write_private(&config_file(app, "session.json")?, &serde_json::to_string(s).map_err(|e| e.to_string())?)
}

fn now_secs() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
}

// ---------- pure helpers (unit tested) ----------

/// Accepts the JSON file Google Cloud Console downloads for an OAuth client ("installed" or "web"),
/// a flat `{ "client_id", "client_secret" }` object, or a bare client ID.
pub fn parse_client(input: &str) -> Result<OAuthClient, String> {
    let input = input.trim();
    let client = if input.starts_with('{') {
        let v: serde_json::Value = serde_json::from_str(input).map_err(|_| "That doesn't look like valid JSON.")?;
        let obj = v.get("installed").or_else(|| v.get("web")).unwrap_or(&v);
        OAuthClient {
            client_id: obj["client_id"].as_str().unwrap_or_default().trim().to_string(),
            client_secret: obj["client_secret"].as_str().map(|s| s.trim().to_string()).filter(|s| !s.is_empty()),
        }
    } else {
        OAuthClient { client_id: input.to_string(), client_secret: None }
    };
    if !client.client_id.ends_with(".apps.googleusercontent.com") {
        return Err("Expected a Google OAuth client ID ending in .apps.googleusercontent.com.".into());
    }
    Ok(client)
}

pub fn pkce_challenge(verifier: &str) -> String {
    URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()))
}

fn random_token(bytes: usize) -> String {
    let mut buf = vec![0u8; bytes];
    rand::thread_rng().fill_bytes(&mut buf);
    URL_SAFE_NO_PAD.encode(buf)
}

pub fn scopes(with_drive: bool, drive_files: bool) -> String {
    let mut s = String::from("openid email profile");
    if with_drive {
        s.push(' ');
        s.push_str(DRIVE_SCOPE);
    }
    if drive_files {
        s.push(' ');
        s.push_str(DRIVE_FILES_SCOPE);
    }
    s
}

pub fn auth_url(client_id: &str, redirect_uri: &str, challenge: &str, state: &str, scope: &str) -> String {
    let mut url = url::Url::parse(AUTH_URL).expect("static url");
    url.query_pairs_mut()
        .append_pair("client_id", client_id)
        .append_pair("redirect_uri", redirect_uri)
        .append_pair("response_type", "code")
        .append_pair("scope", scope)
        .append_pair("code_challenge", challenge)
        .append_pair("code_challenge_method", "S256")
        .append_pair("state", state)
        .append_pair("access_type", "offline")
        .append_pair("include_granted_scopes", "true")
        .append_pair("prompt", "select_account consent");
    url.into()
}

pub enum Callback {
    Code(String),
    Denied(String),
    Ignore,
}

/// Parses the first line of the HTTP request Google's redirect makes to the loopback server.
pub fn parse_callback(request_line: &str, expected_state: &str) -> Result<Callback, String> {
    let path = request_line.split_whitespace().nth(1).unwrap_or("/");
    let url = url::Url::parse(&format!("http://127.0.0.1{path}")).map_err(|e| e.to_string())?;
    let get = |k: &str| url.query_pairs().find(|(key, _)| key == k).map(|(_, v)| v.into_owned());
    if let Some(err) = get("error") {
        return Ok(Callback::Denied(err));
    }
    match (get("code"), get("state")) {
        (Some(code), Some(state)) if state == expected_state => Ok(Callback::Code(code)),
        (Some(_), _) => Err("Sign-in response didn't match this request. Please try again.".into()),
        _ => Ok(Callback::Ignore),
    }
}

const DONE_PAGE: &str = r#"<!doctype html><meta charset="utf-8"><title>mova</title>
<body style="font:15px/1.5 -apple-system,Segoe UI,Inter,sans-serif;display:grid;place-items:center;height:100vh;margin:0;background:#fafafa;color:#171717">
<div style="text-align:center"><div style="font-size:22px;font-weight:600;margin-bottom:6px">You're signed in to mova</div>
<div style="color:#8a8a8a">You can close this tab and return to the app.</div></div>"#;

async fn wait_for_code(listener: TcpListener, state: &str) -> Result<String, String> {
    loop {
        let (mut stream, _) = listener.accept().await.map_err(|e| e.to_string())?;
        let mut buf = vec![0u8; 8192];
        let n = stream.read(&mut buf).await.map_err(|e| e.to_string())?;
        let request = String::from_utf8_lossy(&buf[..n]);
        let line = request.lines().next().unwrap_or_default();
        let result = parse_callback(line, state);
        let (status, body) = match &result {
            Ok(Callback::Ignore) => ("404 Not Found", ""),
            Ok(_) => ("200 OK", DONE_PAGE),
            Err(_) => ("400 Bad Request", "Sign-in failed. Return to mova and try again."),
        };
        let response = format!(
            "HTTP/1.1 {status}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len()
        );
        let _ = stream.write_all(response.as_bytes()).await;
        let _ = stream.shutdown().await;
        match result? {
            Callback::Code(code) => return Ok(code),
            Callback::Denied(e) => return Err(if e == "access_denied" { "Sign-in was cancelled.".into() } else { format!("Google returned: {e}") }),
            Callback::Ignore => continue,
        }
    }
}

// ---------- network ----------

async fn token_request(params: &[(&str, &str)]) -> Result<TokenResponse, String> {
    let res = reqwest::Client::new().post(TOKEN_URL).form(params).send().await.map_err(|e| format!("Couldn't reach Google: {e}"))?;
    let status = res.status();
    let body: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        let msg = body["error_description"].as_str().or(body["error"].as_str()).unwrap_or("unknown error");
        return Err(format!("Google sign-in failed: {msg}"));
    }
    serde_json::from_value(body).map_err(|e| e.to_string())
}

async fn fetch_profile(access_token: &str) -> Result<Profile, String> {
    let v: serde_json::Value = reqwest::Client::new()
        .get(USERINFO_URL)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let email = v["email"].as_str().unwrap_or_default().to_string();
    Ok(Profile {
        sub: v["sub"].as_str().ok_or("Google didn't return an account ID.")?.to_string(),
        name: v["name"].as_str().map(str::to_string).unwrap_or_else(|| email.clone()),
        email,
        picture: v["picture"].as_str().map(str::to_string),
    })
}

async fn access_token(app: &AppHandle) -> Result<String, String> {
    let mut session = load_session(app).ok_or("Not signed in.")?;
    if session.expires_at > now_secs() + 60 {
        return Ok(session.access_token);
    }
    let (client, _) = load_client(app).ok_or("Google sign-in isn't set up.")?;
    let refresh = session.refresh_token.clone().ok_or("Session expired. Please sign in again.")?;
    let mut params = vec![("client_id", client.client_id.as_str()), ("refresh_token", refresh.as_str()), ("grant_type", "refresh_token")];
    if let Some(secret) = client.client_secret.as_deref() {
        params.push(("client_secret", secret));
    }
    let t = token_request(&params).await?;
    session.access_token = t.access_token;
    session.expires_at = now_secs() + t.expires_in;
    save_session(app, &session)?;
    Ok(session.access_token)
}

// ---------- commands ----------

#[tauri::command]
pub fn auth_status(app: AppHandle) -> AuthStatus {
    let client = load_client(&app);
    let session = load_session(&app);
    AuthStatus {
        configured: client.is_some(),
        client_source: client.map(|(_, s)| s),
        drive: session.as_ref().is_some_and(|s| s.scope.split(' ').any(|x| x == DRIVE_SCOPE)),
        drive_files: session.as_ref().is_some_and(|s| s.scope.split(' ').any(|x| x == DRIVE_FILES_SCOPE)),
        profile: session.map(|s| s.profile),
    }
}

#[tauri::command]
pub fn auth_configure_google(app: AppHandle, client_json: String) -> Result<AuthStatus, String> {
    let client = parse_client(&client_json)?;
    write_private(&config_file(&app, "google-oauth.json")?, &serde_json::to_string(&client).map_err(|e| e.to_string())?)?;
    Ok(auth_status(app))
}

#[tauri::command]
pub fn auth_forget_google_client(app: AppHandle) -> Result<AuthStatus, String> {
    let _ = fs::remove_file(config_file(&app, "google-oauth.json")?);
    Ok(auth_status(app))
}

async fn run_flow(app: &AppHandle, scope: String, previous_refresh: Option<String>) -> Result<Profile, String> {
    let (client, _) = load_client(app).ok_or("Google sign-in isn't set up yet.")?;
    let verifier = random_token(48);
    let state = random_token(24);
    let listener = TcpListener::bind("127.0.0.1:0").await.map_err(|e| e.to_string())?;
    let redirect_uri = format!("http://127.0.0.1:{}", listener.local_addr().map_err(|e| e.to_string())?.port());

    let url = auth_url(&client.client_id, &redirect_uri, &pkce_challenge(&verifier), &state, &scope);
    app.opener().open_url(url, None::<&str>).map_err(|e| format!("Couldn't open your browser: {e}"))?;

    let code = tokio::time::timeout(SIGN_IN_TIMEOUT, wait_for_code(listener, &state))
        .await
        .map_err(|_| "Sign-in timed out. Please try again.".to_string())??;

    let mut params = vec![
        ("client_id", client.client_id.as_str()),
        ("code", code.as_str()),
        ("code_verifier", verifier.as_str()),
        ("grant_type", "authorization_code"),
        ("redirect_uri", redirect_uri.as_str()),
    ];
    if let Some(secret) = client.client_secret.as_deref() {
        params.push(("client_secret", secret));
    }
    let tokens = token_request(&params).await?;
    let profile = fetch_profile(&tokens.access_token).await?;
    save_session(
        app,
        &Session {
            profile: profile.clone(),
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token.or(previous_refresh),
            expires_at: now_secs() + tokens.expires_in,
            scope: if tokens.scope.is_empty() { scope } else { tokens.scope },
        },
    )?;
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
    Ok(profile)
}

#[tauri::command]
pub async fn auth_sign_in_google(app: AppHandle, with_drive: bool, drive_files: bool) -> Result<Profile, String> {
    run_flow(&app, scopes(with_drive, drive_files), None).await
}

/// Incremental authorization: asks only for full Drive access on top of what the user already granted.
#[tauri::command]
pub async fn auth_connect_drive_files(app: AppHandle) -> Result<AuthStatus, String> {
    let session = load_session(&app).ok_or("Please sign in first.")?;
    let with_sync = session.scope.split(' ').any(|x| x == DRIVE_SCOPE);
    run_flow(&app, scopes(with_sync, true), session.refresh_token).await?;
    Ok(auth_status(app))
}

#[tauri::command]
pub async fn auth_sign_out(app: AppHandle) -> Result<(), String> {
    if let Some(s) = load_session(&app) {
        if let Some(token) = s.refresh_token.or(Some(s.access_token)) {
            let _ = reqwest::Client::new().post(REVOKE_URL).form(&[("token", token)]).send().await;
        }
    }
    let _ = fs::remove_file(config_file(&app, "session.json")?);
    Ok(())
}

#[derive(Serialize)]
pub struct RemoteWorkspace {
    content: String,
    modified_time: String,
}

async fn find_drive_file(token: &str) -> Result<Option<(String, String)>, String> {
    let v: serde_json::Value = reqwest::Client::new()
        .get("https://www.googleapis.com/drive/v3/files")
        .bearer_auth(token)
        .query(&[("spaces", "appDataFolder"), ("q", &format!("name = '{DRIVE_FILE_NAME}'")), ("fields", "files(id,modifiedTime)")])
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| format!("Google Drive: {e}"))?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    Ok(v["files"][0]["id"].as_str().map(|id| (id.to_string(), v["files"][0]["modifiedTime"].as_str().unwrap_or_default().to_string())))
}

#[tauri::command]
pub async fn drive_pull(app: AppHandle) -> Result<Option<RemoteWorkspace>, String> {
    let token = access_token(&app).await?;
    let Some((id, modified_time)) = find_drive_file(&token).await? else { return Ok(None) };
    let content = reqwest::Client::new()
        .get(format!("https://www.googleapis.com/drive/v3/files/{id}"))
        .bearer_auth(&token)
        .query(&[("alt", "media")])
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| format!("Google Drive: {e}"))?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    Ok(Some(RemoteWorkspace { content, modified_time }))
}

#[tauri::command]
pub async fn drive_push(app: AppHandle, content: String) -> Result<(), String> {
    let token = access_token(&app).await?;
    let client = reqwest::Client::new();
    let req = match find_drive_file(&token).await? {
        Some((id, _)) => client
            .patch(format!("https://www.googleapis.com/upload/drive/v3/files/{id}"))
            .query(&[("uploadType", "media")])
            .header("Content-Type", "application/json")
            .body(content),
        None => {
            let boundary = format!("mova{}", random_token(12));
            let meta = serde_json::json!({ "name": DRIVE_FILE_NAME, "parents": ["appDataFolder"] });
            let body = format!(
                "--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{meta}\r\n--{boundary}\r\nContent-Type: application/json\r\n\r\n{content}\r\n--{boundary}--"
            );
            client
                .post("https://www.googleapis.com/upload/drive/v3/files")
                .query(&[("uploadType", "multipart")])
                .header("Content-Type", format!("multipart/related; boundary={boundary}"))
                .body(body)
        }
    };
    req.bearer_auth(&token).send().await.map_err(|e| e.to_string())?.error_for_status().map_err(|e| format!("Google Drive: {e}"))?;
    Ok(())
}

// ---------- Google Drive files ----------

#[derive(Serialize)]
pub struct DriveFile {
    id: String,
    name: String,
    mime_type: String,
    modified_time: String,
    size: Option<u64>,
    is_folder: bool,
    web_view_link: Option<String>,
}

fn escape_query(v: &str) -> String {
    v.replace('\\', "\\\\").replace('\'', "\\'")
}

/// Lists a Drive folder ("root" by default), or searches by name across the Drive when `query` is set.
#[tauri::command]
pub async fn gdrive_list(app: AppHandle, parent: Option<String>, query: Option<String>) -> Result<Vec<DriveFile>, String> {
    let token = access_token(&app).await?;
    let q = match query.filter(|q| !q.trim().is_empty()) {
        Some(q) => format!("name contains '{}' and trashed = false", escape_query(q.trim())),
        None => format!("'{}' in parents and trashed = false", escape_query(parent.as_deref().unwrap_or("root"))),
    };
    let v: serde_json::Value = reqwest::Client::new()
        .get("https://www.googleapis.com/drive/v3/files")
        .bearer_auth(&token)
        .query(&[
            ("q", q.as_str()),
            ("orderBy", "folder,name"),
            ("pageSize", "200"),
            ("fields", "files(id,name,mimeType,modifiedTime,size,webViewLink)"),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| format!("Google Drive: {e}"))?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    Ok(v["files"]
        .as_array()
        .map(|files| {
            files
                .iter()
                .map(|f| {
                    let mime = f["mimeType"].as_str().unwrap_or_default().to_string();
                    DriveFile {
                        id: f["id"].as_str().unwrap_or_default().into(),
                        name: f["name"].as_str().unwrap_or_default().into(),
                        is_folder: mime == "application/vnd.google-apps.folder",
                        mime_type: mime,
                        modified_time: f["modifiedTime"].as_str().unwrap_or_default().into(),
                        size: f["size"].as_str().and_then(|s| s.parse().ok()),
                        web_view_link: f["webViewLink"].as_str().map(str::to_string),
                    }
                })
                .collect()
        })
        .unwrap_or_default())
}

const MAX_EDIT_BYTES: usize = 2_000_000;

#[tauri::command]
pub async fn gdrive_read(app: AppHandle, id: String) -> Result<String, String> {
    let token = access_token(&app).await?;
    let bytes = reqwest::Client::new()
        .get(format!("https://www.googleapis.com/drive/v3/files/{id}"))
        .bearer_auth(&token)
        .query(&[("alt", "media")])
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| format!("Google Drive: {e}"))?
        .bytes()
        .await
        .map_err(|e| e.to_string())?;
    if bytes.len() > MAX_EDIT_BYTES {
        return Err("This file is too large to edit in mova (2 MB limit).".into());
    }
    String::from_utf8(bytes.to_vec()).map_err(|_| "This file isn't text, so it can't be opened in the editor.".into())
}

#[tauri::command]
pub async fn gdrive_write(app: AppHandle, id: String, content: String) -> Result<String, String> {
    let token = access_token(&app).await?;
    let v: serde_json::Value = reqwest::Client::new()
        .patch(format!("https://www.googleapis.com/upload/drive/v3/files/{id}"))
        .bearer_auth(&token)
        .query(&[("uploadType", "media"), ("fields", "modifiedTime")])
        .body(content)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| format!("Google Drive: {e}"))?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    Ok(v["modifiedTime"].as_str().unwrap_or_default().to_string())
}

#[tauri::command]
pub async fn gdrive_create(app: AppHandle, name: String, parent: Option<String>, content: String) -> Result<String, String> {
    let token = access_token(&app).await?;
    let boundary = format!("mova{}", random_token(12));
    let meta = serde_json::json!({ "name": name, "parents": [parent.unwrap_or_else(|| "root".into())] });
    let body = format!(
        "--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{meta}\r\n--{boundary}\r\nContent-Type: text/plain\r\n\r\n{content}\r\n--{boundary}--"
    );
    let v: serde_json::Value = reqwest::Client::new()
        .post("https://www.googleapis.com/upload/drive/v3/files")
        .bearer_auth(&token)
        .query(&[("uploadType", "multipart"), ("fields", "id")])
        .header("Content-Type", format!("multipart/related; boundary={boundary}"))
        .body(body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| format!("Google Drive: {e}"))?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    Ok(v["id"].as_str().unwrap_or_default().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pkce_matches_rfc7636_example() {
        assert_eq!(pkce_challenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
    }

    #[test]
    fn parses_google_console_json() {
        let json = r#"{"installed":{"client_id":"123-abc.apps.googleusercontent.com","project_id":"mova","client_secret":"GOCSPX-test","redirect_uris":["http://localhost"]}}"#;
        assert_eq!(
            parse_client(json).unwrap(),
            OAuthClient { client_id: "123-abc.apps.googleusercontent.com".into(), client_secret: Some("GOCSPX-test".into()) }
        );
    }

    #[test]
    fn parses_bare_client_id_and_rejects_garbage() {
        assert_eq!(parse_client(" 1-x.apps.googleusercontent.com ").unwrap().client_secret, None);
        assert!(parse_client("sk-not-a-google-client").is_err());
        assert!(parse_client(r#"{"installed":{}}"#).is_err());
    }

    #[test]
    fn builds_auth_url_with_pkce_and_loopback() {
        let url = auth_url("id.apps.googleusercontent.com", "http://127.0.0.1:5555", "chal", "st", &scopes(true, false));
        let parsed = url::Url::parse(&url).unwrap();
        let q: std::collections::HashMap<_, _> = parsed.query_pairs().into_owned().collect();
        assert_eq!(parsed.host_str(), Some("accounts.google.com"));
        assert_eq!(q["redirect_uri"], "http://127.0.0.1:5555");
        assert_eq!(q["code_challenge_method"], "S256");
        assert_eq!(q["response_type"], "code");
        assert!(q["scope"].contains("openid") && q["scope"].contains("drive.appdata"));
        assert!(!scopes(false, false).contains("drive"));
        assert!(scopes(false, true).ends_with("/auth/drive"));
        assert_eq!(q["include_granted_scopes"], "true");
    }

    #[test]
    fn escapes_drive_query() {
        assert_eq!(escape_query("it's"), "it\\'s");
    }

    #[test]
    fn parses_callback() {
        assert!(matches!(parse_callback("GET /?state=s1&code=4%2Fabc HTTP/1.1", "s1").unwrap(), Callback::Code(c) if c == "4/abc"));
        assert!(matches!(parse_callback("GET /?error=access_denied&state=s1 HTTP/1.1", "s1").unwrap(), Callback::Denied(_)));
        assert!(matches!(parse_callback("GET /favicon.ico HTTP/1.1", "s1").unwrap(), Callback::Ignore));
        assert!(parse_callback("GET /?state=evil&code=x HTTP/1.1", "s1").is_err());
    }
}
